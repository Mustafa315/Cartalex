import express from 'express';
import db from './db.js';
import { addWhereVestiges, addWhereDecouvertes, addWhereBiblio, addOrderAliasOnSelectDistinct, cacheMiddleware } from './middleware.js';

const router = express.Router();

router.get('/', (req, res) => res.render('index.html'));

// --- START: MODIFIED SECTION FOR CLEAN URLS ---
// This route handles the deep link with a point ID, e.g., /carte/30
// It must come BEFORE the generic /carte route
router.get('/carte/:fid(\\d+)', (req, res) => res.render('map.html'));

// This route handles the base map page, e.g., /carte
router.get('/carte', (req, res) => res.render('map.html'));
// --- END: MODIFIED SECTION FOR CLEAN URLS ---


// ### START: CORRECTED SECTION ###
// This endpoint now correctly fetches all data needed for the detailed popup.
router.get('/sitesFouilles/:fid/details', async (req, res, next) => {
    const { fid } = req.params;
    try {
        const details = await db.oneOrNone(`
            SELECT 
                sf.id, sf.num_tkaczow, sf.commentaire,
                p.nom AS inventeur, d.date_decouverte
            FROM public.sites_fouilles AS sf
            LEFT JOIN public.decouvertes AS d ON sf.id = d.id_site
            LEFT JOIN public.personnes AS p ON d.id_inventeur = p.id
            WHERE sf.fid = $1 LIMIT 1;
        `, [fid]);

        if (!details) {
            return res.status(404).json({ error: 'Site not found' });
        }

        const vestiges = await db.any(`
            SELECT c.caracterisation, p.periode FROM public.vestiges v
            JOIN public.caracterisations c ON v.id_caracterisation = c.id
            LEFT JOIN public.datations d ON v.id = d.id_vestige
            LEFT JOIN public.periodes p ON d.id_periode = p.id
            WHERE v.id_site = $1;
        `, [details.id]);

        // THIS QUERY IS NOW CORRECTED
        const bibliographies = await db.any(`
            SELECT 
                b.nom_document, 
                p.nom AS auteur, 
                b.date_publication AS annee,
                rb.pages
            FROM public.bibliographies b
            JOIN public."references_biblio" rb ON b.id = rb.id_biblio
            JOIN public.decouvertes d ON rb.id_decouverte = d.id
            LEFT JOIN public.personnes p ON b.id_auteur1 = p.id
            WHERE d.id_site = $1;
        `, [details.id]);
        
        res.json({
            details: details,
            vestiges: vestiges,
            bibliographies: bibliographies
        });
    } catch (error) {
        next(error);
    }
});
// ### END: CORRECTED SECTION ###

// --- Your other routes, now with 'public.' prefix ---

router.get('/getValues/:tableName', cacheMiddleware, addOrderAliasOnSelectDistinct, async (req, res, next) => {
    const { tableName } = req.params;
    let dbquery = res.locals.selectQuery;
    switch (tableName) {
        case 'vestiges': 
            dbquery += ' FROM public.vestiges JOIN public.datations ON public.vestiges.id = public.datations.id_vestige JOIN public.caracterisations ON public.vestiges.id_caracterisation = public.caracterisations.id JOIN public.periodes ON public.datations.id_periode = public.periodes.id'; 
            break;
        case 'bibliographies': 
            dbquery += ' FROM public.bibliographies JOIN public.personnes ON public.bibliographies.id_auteur1 = public.personnes.id'; 
            break;
        case 'periodes': 
            dbquery += ' FROM public.periodes'; 
            break;
        case 'decouvertes': 
            dbquery += ' FROM public.decouvertes JOIN public.personnes ON public.decouvertes.id_inventeur = public.personnes.id'; 
            break;
        case 'parcellesRegion':
            dbquery += ` FROM public.parcelles_region`; 
            break;
        default: 
            return res.status(404).json({ error: 'Table not found' });
    }
    dbquery += res.locals.orderQuery;
    try {
        const values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        next(error);
    }
});

router.get('/sitesFouilles/vestiges', addWhereVestiges, async (req, res, next) => {
    const dbquery = `
        SELECT DISTINCT sf.fid as id FROM public.sites_fouilles AS sf
        JOIN public.vestiges AS v ON v.id_site = sf.id
        JOIN public.datations AS dat ON dat.id_vestige = v.id
        JOIN public.periodes AS p ON dat.id_periode = p.id
        JOIN public.caracterisations AS c ON v.id_caracterisation = c.id
        ${res.locals.whereClause}`;
    try {
        const values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        next(error);
    }
});

router.get('/sitesFouilles/decouvertes', addWhereDecouvertes, async (req, res, next) => {
    const dbquery = `
        SELECT DISTINCT sf.fid as id FROM public.sites_fouilles AS sf
        JOIN public.decouvertes AS d ON sf.id = d.id_site
        JOIN public.personnes AS p ON d.id_inventeur = p.id
        ${res.locals.whereClause}`;
    try {
        const values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        next(error);
    }
});

router.get('/sitesFouilles/bibliographies', addWhereBiblio, async (req, res, next) => {
    const dbquery = `
        SELECT DISTINCT sf.fid as id FROM public.sites_fouilles AS sf
        JOIN public.decouvertes AS d ON sf.id = d.id_site
        JOIN public."references_biblio" AS rb ON d.id = rb.id_decouverte
        JOIN public.bibliographies AS b ON b.id = rb.id_biblio
        JOIN public.personnes AS p ON p.id = b.id_auteur1
        ${res.locals.whereClause}`;
    try {
        const values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        next(error);
    }
});

router.get('/parcellesRegion/general', async (req, res, next) => {
    let whereClause = "";
    const conditions = [];
    if (req.query.nom) {
        const noms = req.query.nom.split('|').map(val => `'${val.replace(/'/g, "''")}'`).join(',');
        conditions.push(`nom IN (${noms})`);
    }
    if (req.query.numero) {
        const numeros = req.query.numero.split('|').map(val => `'${val.replace(/'/g, "''")}'`).join(',');
        conditions.push(`numero IN (${numeros})`);
    }
    if (conditions.length > 0) {
        whereClause = ' WHERE ' + conditions.join(' AND ');
    }
    const dbquery = `SELECT fid as id FROM public.parcelles_region${whereClause}`;
    try {
        const values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        next(error);
    }
});

export default router;