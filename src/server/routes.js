import express from 'express';
import db from './db.js';
import { addWhere, addWhereSf, addWhereMainTable, addOrderAliasOnSelectDistinct, cacheMiddleware } from './middleware.js';

const router = express.Router();

// Helper to extract values for parameterized queries from req.query
function extractWhereParams(query) {
    const params = [];
    for (let param in query) {
        if (param.endsWith('floor') || param.endsWith('ceil')) {
            params.push(query[param].split('|')[1]);
        } else if (param !== 'limit' && param !== 'offset') {
            params.push(...query[param].split('|').map(v => v.replaceAll("'", "''")));
        }
    }
    return params;
}

// Helper to get pagination SQL and params
function getPagination(query) {
    const limit = parseInt(query.limit, 10) || 50;
    const offset = parseInt(query.offset, 10) || 0;
    return {
        sql: ' LIMIT $[limit] OFFSET $[offset]',
        params: { limit, offset }
    };
}

// Route handlers
router.get('/', async (req, res) => {
    res.render('index.html');
});

router.get('/carte', async (req, res) => {
    res.render('map.html');
});

router.get('/getValues/vestiges', cacheMiddleware, addOrderAliasOnSelectDistinct, async (req, res) => {
    const dbquery = res.locals.selectQuery
        + ' FROM vestiges'
        + ' JOIN datations ON vestiges.id = datations.id_vestige'
        + ' JOIN caracterisations ON vestiges.id_caracterisation = caracterisations.id'
        + ' JOIN periodes ON datations.id_periode = periodes.id'
        + res.locals.orderQuery;
    const { sql: pagSQL, params: pagParams } = getPagination(req.query);
    try {
        const values = await db.any(dbquery + pagSQL, pagParams);
        res.json(values);
    } catch (error) {
        res.send(error);
    }
});

router.get('/getValues/bibliographies', cacheMiddleware, addOrderAliasOnSelectDistinct, async (req, res) => {
    const dbquery = res.locals.selectQuery
        + ' FROM bibliographies'
        + ' JOIN personnes ON bibliographies.id_auteur1 = personnes.id'
        + res.locals.orderQuery;
    const { sql: pagSQL, params: pagParams } = getPagination(req.query);
    try {
        const values = await db.any(dbquery + pagSQL, pagParams);
        res.json(values);
    } catch (error) {
        res.send(error);
    }
});

router.get('/getValues/periodes', cacheMiddleware, addOrderAliasOnSelectDistinct, async (req, res) => {
    const dbquery = res.locals.selectQuery
        + ' FROM periodes'
        + res.locals.orderQuery;
    const { sql: pagSQL, params: pagParams } = getPagination(req.query);
    try {
        const values = await db.any(dbquery + pagSQL, pagParams);
        res.json(values);
    } catch (error) {
        res.send(error);
    }
});

router.get('/getValues/decouvertes', cacheMiddleware, addOrderAliasOnSelectDistinct, async (req, res) => {
    const dbquery = res.locals.selectQuery
        + ' FROM decouvertes'
        + ' JOIN personnes ON decouvertes.id_inventeur = personnes.id'
        + res.locals.orderQuery;
    const { sql: pagSQL, params: pagParams } = getPagination(req.query);
    try {
        const values = await db.any(dbquery + pagSQL, pagParams);
        res.json(values);
    } catch (error) {
        res.send(error);
    }
});

router.get('/sitesFouilles/vestiges', addWhereMainTable, async (req, res) => {
    // Select only needed fields instead of *
    let dbquery = `SELECT vestiges.id, vestiges.name, sites_fouilles.id as site_id, datations.id as datation_id, p.id as periode_id, c.id as caracterisation_id
        FROM vestiges`
        + ' JOIN sites_fouilles ON sites_fouilles.id = vestiges.id_site'
        + ' JOIN datations ON datations.id_vestige = vestiges.id'
        + ' JOIN periodes as p ON datations.id_periode = p.id'
        + ' JOIN caracterisations AS c ON vestiges.id_caracterisation = c.id '
        + res.locals.whereClause
        + ' ORDER by c.caracterisation, p.periode';
    const params = extractWhereParams(req.query);
    const { sql: pagSQL, params: pagParams } = getPagination(req.query);
    try {
        const values = await db.any(dbquery + pagSQL, { ...pagParams, ...params });
        res.json(values);
    } catch (error) {
        res.send(error);
    }
});

router.get('/sitesFouilles/decouvertes', addWhere, async (req, res) => {
    // Select only needed fields
    let dbquery = 'SELECT DISTINCT sf.id, d.id as decouverte_id, p.id as inventeur_id FROM sites_fouilles AS sf'
        + ' JOIN decouvertes AS d ON sf.id = d.id_site'
        + ' JOIN personnes AS p ON d.id_inventeur = p.id '
        + res.locals.whereClause;
    const params = extractWhereParams(req.query);
    const { sql: pagSQL, params: pagParams } = getPagination(req.query);
    try {
        const values = await db.any(dbquery + pagSQL, { ...pagParams, ...params });
        res.json(values);
    } catch (error) {
        res.send(error);
    }
});

router.get('/sitesFouilles/bibliographies', addWhereSf, async (req, res) => {
    // Select only needed fields
    let dbquery = 'SELECT sf.id as site_id, d.id as decouverte_id, rb.id as ref_biblio_id, b.id as biblio_id, p.id as auteur_id FROM sites_fouilles AS sf'
        + ' JOIN decouvertes AS d ON sf.id = d.id_site'
        + ' JOIN references_biblio AS rb ON rb.id_decouverte = d.id'
        + ' JOIN bibliographies AS b ON b.id = rb.id'
        + ' JOIN personnes AS p ON p.id = b.id_auteur1'
        + res.locals.whereClause;
    const params = extractWhereParams(req.query);
    const { sql: pagSQL, params: pagParams } = getPagination(req.query);
    try {
        const values = await db.any(dbquery + pagSQL, { ...pagParams, ...params });
        res.json(values);
    } catch (error) {
        res.send(error);
    }
});

router.get('/getInfos/sitesFouilles', addWhereSf, async (req, res) => {
    // Select only needed fields
    let dbquery = 'SELECT sf.id, sf.commentaire as sf_commentaire, d.id as decouverte_id, pers.id as inventeur_id FROM sites_fouilles AS sf'
        + ' JOIN decouvertes AS d ON sf.id = d.id_site'
        + ' JOIN personnes AS pers ON d.id_inventeur = pers.id '
        + res.locals.whereClause;
    const params = extractWhereParams(req.query);
    const { sql: pagSQL, params: pagParams } = getPagination(req.query);
    try {
        const values = await db.any(dbquery + pagSQL, { ...pagParams, ...params });
        res.json(values);
    } catch (error) {
        res.send(error);
    }
});

export default router; 