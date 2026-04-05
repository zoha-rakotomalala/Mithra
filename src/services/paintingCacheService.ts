import type {Painting} from '@/types/painting';
import {supabase} from '@/services/supabase';
import {getMuseumMap} from '@/services/museumCache';

function extractExternalId(legacyId: string): string {
    const match = legacyId.match(/^[a-z]+-(.+)$/);
    return match ? match[1] : legacyId;
}

function convertToPainting(db: any): Painting {
    const m = db.metadata || {};
    let imageUrl = db.image_url;
    let thumbnailUrl = db.thumbnail_url;
    if (!imageUrl && m.image_id && db.legacy_id && db.legacy_id.indexOf('chicago-') === 0) {
        imageUrl = 'https://www.artic.edu/iiif/2/' + m.image_id + '/full/843,/0/default.jpg';
        thumbnailUrl = 'https://www.artic.edu/iiif/2/' + m.image_id + '/full/200,/0/default.jpg';
    }
    return {
        id: db.id,
        title: db.title,
        artist: db.artist,
        year: db.year,
        imageUrl,
        thumbnailUrl,
        color: db.color,
        museum: m.museum || db.museum_id,
        description: m.description,
        medium: m.medium,
        dimensions: m.dimensions,
        location: m.location,
        objectURL: m.objectURL,
        period: m.period,
        culture: m.culture,
        department: m.department,
        sourceMuseumId: m.sourceMuseumId,
    };
}

export async function getCachedPaintings(museumLegacyId: string, searchQuery: string, searchType: 'artist' | 'title'): Promise<Painting[]> {
    try {
        const query = searchQuery.toLowerCase().trim();
        const {
            data: entry,
            error: entryError
        } = await supabase.from('search_cache').select('painting_ids, last_verified_at').eq('query', query).eq('search_type', searchType).eq('museum_id', museumLegacyId).single();
        if (entryError && entryError.code !== 'PGRST116') throw entryError;
        if (entry && entry.painting_ids.length > 0) {
            const {
                data: paintings,
                error: pe
            } = await supabase.from('paintings').select('*').in('id', entry.painting_ids);
            if (pe) throw pe;
            if (paintings && paintings.length > 0) {
                console.log('Cache HIT: ' + museumLegacyId + ' "' + query + '" (' + paintings.length + ' paintings)');
                return paintings.map((p: any) => convertToPainting(p));
            }
        }
        console.log('Cache MISS: ' + museumLegacyId + ' "' + query + '"');
        return [];
    } catch (err) {
        console.error('Error reading from cache:', err);
        return [];
    }
}

export async function updateCacheWithFreshResults(museumLegacyId: string, searchQuery: string, searchType: 'artist' | 'title', freshPaintings: Painting[]): Promise<{
    added: number;
    updated: number;
    unchanged: number;
    legacyToUuid: Record<string, string>;
}> {
    try {
        const query = searchQuery.toLowerCase().trim();
        const stats = {added: 0, updated: 0, unchanged: 0, legacyToUuid: {} as Record<string, string>};
        if (freshPaintings.length === 0) return stats;
        const museumMap = await getMuseumMap();
        const museum = museumMap[museumLegacyId];
        if (!museum) {
            console.error('Museum not found:', museumLegacyId);
            return stats;
        }
        const museumUuid = museum.id;
        const {data: currentCache} = await supabase.from('search_cache').select('painting_ids').eq('query', query).eq('search_type', searchType).eq('museum_id', museumLegacyId).single();
        const currentIds: Record<string, boolean> = {};
        (currentCache?.painting_ids || []).forEach((id: string) => {
            currentIds[id] = true;
        });
        const dbPaintings = freshPaintings.map((painting: any) => {
            const legacyId = String(painting.id);
            const externalId = extractExternalId(legacyId);
            const metadata: any = {
                description: painting.description,
                medium: painting.medium,
                dimensions: painting.dimensions,
                location: painting.location,
                museum: painting.museum,
                objectURL: painting.objectURL,
                period: painting.period,
                culture: painting.culture,
                department: painting.department,
                sourceMuseumId: museumLegacyId
            };
            if (legacyId.indexOf('chicago-') === 0 && painting.image_id) metadata.image_id = painting.image_id;
            return {
                museum_id: museumUuid,
                external_id: externalId,
                legacy_id: legacyId,
                title: painting.title,
                artist: painting.artist,
                year: painting.year ? String(painting.year) : null,
                image_url: painting.imageUrl || null,
                thumbnail_url: painting.thumbnailUrl || null,
                color: painting.color || '#cccccc',
                metadata,
                last_verified_at: new Date().toISOString(),
                verification_status: 'verified',
                verification_source: 'api',
                updated_at: new Date().toISOString()
            };
        });
        // Deduplicate by (museum_id, external_id) to avoid Postgres upsert conflict
        const seen = new Set<string>();
        const uniqueDbPaintings = dbPaintings.filter(p => {
            const key = `${p.museum_id}:${p.external_id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        const batchSize = 50;
        for (let i = 0; i < uniqueDbPaintings.length; i += batchSize) {
            const {error} = await supabase.from('paintings').upsert(uniqueDbPaintings.slice(i, i + batchSize), {
                onConflict: 'museum_id,external_id',
                ignoreDuplicates: false
            });
            if (error) console.error('Upsert error:', error);
        }
        const externalIds = freshPaintings.map((p: any) => extractExternalId(String(p.id)));
        const {data: upserted} = await supabase.from('paintings').select('id, external_id').eq('museum_id', museumUuid).in('external_id', externalIds);
        const freshUuids = (upserted || []).map((p: any) => p.id);

        // Build legacy ID → UUID mapping so callers can update in-memory paintings
        const externalToUuid = new Map<string, string>();
        for (const row of (upserted || [])) {
            externalToUuid.set(row.external_id, row.id);
        }
        for (const painting of freshPaintings) {
            const legacyId = String(painting.id);
            const extId = extractExternalId(legacyId);
            const uuid = externalToUuid.get(extId);
            if (uuid) {
                stats.legacyToUuid[legacyId] = uuid;
            }
        }
        stats.added = freshPaintings.filter((p: any) => !currentIds[String(p.id)]).length;
        stats.updated = freshPaintings.filter((p: any) => !!currentIds[String(p.id)]).length;
        await supabase.from('search_cache').upsert({
            query,
            search_type: searchType,
            museum_id: museumLegacyId,
            painting_ids: freshUuids,
            last_verified_at: new Date().toISOString(),
            verification_status: 'fresh',
            updated_at: new Date().toISOString()
        }, {onConflict: 'query,search_type,museum_id'});
        console.log('Cache updated: ' + museumLegacyId + ' "' + query + '" (+' + stats.added + ' new, ~' + stats.updated + ' updated)');
        return stats;
    } catch (err) {
        console.error('Error updating cache:', err);
        return {added: 0, updated: 0, unchanged: 0, legacyToUuid: {}};
    }
}

export async function getCacheFreshness(museumLegacyId: string, searchQuery: string, searchType: 'artist' | 'title'): Promise<{
    exists: boolean;
    ageMinutes: number;
    shouldRevalidate: boolean
}> {
    try {
        const query = searchQuery.toLowerCase().trim();
        const {
            data,
            error
        } = await supabase.from('search_cache').select('last_verified_at').eq('query', query).eq('search_type', searchType).eq('museum_id', museumLegacyId).single();
        if (error && error.code !== 'PGRST116') throw error;
        if (!data) return {exists: false, ageMinutes: Infinity, shouldRevalidate: true};
        const ageMinutes = Math.floor((Date.now() - new Date(data.last_verified_at).getTime()) / 60000);
        return {exists: true, ageMinutes, shouldRevalidate: ageMinutes > 1440};
    } catch (err) {
        console.error('Error checking cache freshness:', err);
        return {exists: false, ageMinutes: Infinity, shouldRevalidate: true};
    }
}

export async function markStaleCacheEntries(daysOld: number = 30): Promise<number> {
    try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);
        const {
            data,
            error
        } = await supabase.from('search_cache').update({verification_status: 'stale'}).lt('last_verified_at', cutoff.toISOString()).eq('verification_status', 'fresh').select('id');
        if (error) throw error;
        return data?.length || 0;
    } catch (err) {
        console.error('Error marking stale cache:', err);
        return 0;
    }
}

export async function cleanupOrphanedPaintings(daysOld: number = 180): Promise<number> {
    try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);
        const {data: old} = await supabase.from('paintings').select('id').lt('cached_at', cutoff.toISOString());
        if (!old || old.length === 0) return 0;
        const {data: caches} = await supabase.from('search_cache').select('painting_ids');
        const referenced: Record<string, boolean> = {};
        (caches || []).forEach((c: any) => (c.painting_ids || []).forEach((id: string) => {
            referenced[id] = true;
        }));
        const orphaned = old.map((p: any) => p.id).filter((id: string) => !referenced[id]);
        if (orphaned.length === 0) return 0;
        const {error} = await supabase.from('paintings').delete().in('id', orphaned);
        if (error) throw error;
        return orphaned.length;
    } catch (err) {
        console.error('Error cleaning orphaned paintings:', err);
        return 0;
    }
}

export async function getCachedPaintingById(paintingUuid: string): Promise<Painting | null> {
    try {
        const {data, error} = await supabase.from('paintings').select('*').eq('id', paintingUuid).single();
        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data ? convertToPainting(data) : null;
    } catch (err) {
        console.error('Error getting cached painting:', err);
        return null;
    }
}

export async function getCacheStats(): Promise<{
    totalPaintings: number;
    totalSearches: number;
    paintingsByMuseum: Record<string, number>;
    searchesByMuseum: Record<string, number>;
    freshSearches: number;
    staleSearches: number
}> {
    try {
        const [{count: tp}, {count: ts}, {count: fs}, {count: ss}, {data: mp}, {data: ms}] = await Promise.all([supabase.from('paintings').select('*', {
            count: 'exact',
            head: true
        }), supabase.from('search_cache').select('*', {
            count: 'exact',
            head: true
        }), supabase.from('search_cache').select('*', {
            count: 'exact',
            head: true
        }).eq('verification_status', 'fresh'), supabase.from('search_cache').select('*', {
            count: 'exact',
            head: true
        }).eq('verification_status', 'stale'), supabase.from('paintings').select('museum_id'), supabase.from('search_cache').select('museum_id'),]);
        const paintingsByMuseum: Record<string, number> = {};
        (mp || []).forEach((p: any) => {
            paintingsByMuseum[p.museum_id] = (paintingsByMuseum[p.museum_id] || 0) + 1;
        });
        const searchesByMuseum: Record<string, number> = {};
        (ms || []).forEach((s: any) => {
            searchesByMuseum[s.museum_id] = (searchesByMuseum[s.museum_id] || 0) + 1;
        });
        return {
            totalPaintings: tp || 0,
            totalSearches: ts || 0,
            paintingsByMuseum,
            searchesByMuseum,
            freshSearches: fs || 0,
            staleSearches: ss || 0
        };
    } catch (err) {
        console.error('Error getting cache stats:', err);
        return {
            totalPaintings: 0,
            totalSearches: 0,
            paintingsByMuseum: {},
            searchesByMuseum: {},
            freshSearches: 0,
            staleSearches: 0
        };
    }
}