const fs = require('fs');
const { Client } = require('pg');

// --- Configuration ---
const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'cartalex_basileia_3857',
    password: 'postgres',
    port: 5432,
};
const inputFile = './correction_map.csv';
const outputFile = './final_fix.sql';
// --------------------

async function generateFix() {
    const client = new Client(dbConfig);
    try {
        await client.connect();
        console.log('Connected to the database.');

        const correctionMap = fs.readFileSync(inputFile, 'utf8')
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => {
                const [namePart, fids] = line.split(',');
                // Handle multiple FIDs separated by a semicolon
                const correctFids = fids.trim().split(';').map(fid => parseInt(fid.trim(), 10));
                return { namePart: namePart.trim(), correctFids };
            });

        let sqlCommands = '-- SQL commands to correct bibliography links\n\n';
        
        for (const item of correctionMap) {
            console.log(`Processing: ${item.namePart} -> fids ${item.correctFids.join(', ')}`);

            // 1. Get the biblio_id for the document
            const biblioRes = await client.query(
                `SELECT id as biblio_id FROM bibliographies WHERE nom_document ILIKE $1;`,
                [`%${item.namePart}%`]
            );
            if (biblioRes.rows.length === 0) {
                console.warn(`  - WARN: Could not find biblio_id for "${item.namePart}"`);
                continue;
            }
            // Handle cases where multiple documents match the name part
            for (const row of biblioRes.rows) {
                const biblioId = row.biblio_id;
                sqlCommands += `-- Correction for document like "${item.namePart}" (biblio_id: ${biblioId})\n`;
                sqlCommands += `DELETE FROM public.references_biblio WHERE id_biblio = ${biblioId};\n`;

                // 2. Get the decouverte_id for each correct site
                for (const fid of item.correctFids) {
                    const decouverteRes = await client.query(
                        `SELECT d.id as decouverte_id FROM sites_fouilles s JOIN decouvertes d ON s.id = d.id_site WHERE s.fid = $1;`,
                        [fid]
                    );
                    if (decouverteRes.rows.length === 0) {
                        console.warn(`  - WARN: Could not find decouverte_id for fid "${fid}"`);
                        continue;
                    }
                    const correctDecouverteId = decouverteRes.rows[0].decouverte_id;
                    sqlCommands += `INSERT INTO public.references_biblio (id_decouverte, id_biblio) VALUES (${correctDecouverteId}, ${biblioId});\n`;
                }
                 sqlCommands += `\n`;
            }
        }
        
        fs.writeFileSync(outputFile, sqlCommands);
        console.log(`\nSuccessfully generated SQL script at: ${outputFile}`);

    } catch (err) {
        console.error('An error occurred:', err);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

generateFix();