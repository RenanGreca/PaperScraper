import ieee from "../configs/ieee.json";
import acm from "../configs/acm.json"
import springer from "../configs/springer.json"
import wiley from "../configs/wiley.json"
import { test } from "./base";
import { IEEESearch } from "../pageObjects/IEEESearch";
import { ACMSearch } from "../pageObjects/ACMSearch";
import { SpringerSearch } from "../pageObjects/SpringerSearch";
import { WileySearch } from "../pageObjects/WileySearch";

test.describe.configure({ mode: 'parallel' });

const libraries = [
    {
        name: "IEEE",
        Pom: IEEESearch,
        params: ieee,
        format: "CSV",
        singleExport: false
    },
    {
        name: "ACM",
        Pom: ACMSearch,
        params: acm,
        format: "JSON",
        singleExport: false
    },
    {
        name: "Springer",
        Pom: SpringerSearch,
        params: springer,
        format: "CSV",
        singleExport: true
    },
    {
        name: "Wiley",
        Pom: WileySearch,
        params: wiley,
        format: "BibTex",
        singleExport: false
    }
]

for (const library of libraries) {
    test(`Perform search in ${library.name}`, async ({ page, dateRange }) => {
        test.setTimeout(5*60*1000)
        
        const name = library.name
        const json = library.params
        const pom = new library.Pom(page)
    
        const numberOfHits = await test.step('Initial search', async() => {
            console.log(`[${name}] Loading page...`)
            await pom.performQuery(json.url, json.query, dateRange.startYear, dateRange.endYear, json.params)
            const numberOfHits = await pom.getNumberOfHits()
            console.log(`[${name}] Nº of results: ${numberOfHits}`)
            return numberOfHits
        })

        if (library.singleExport) {
            await pom.exportResults()
            console.log(`[${name}]Downloaded ${library.format}`)
        } else {
            const numPages = Math.ceil(numberOfHits/json.pageSize)
        
            for(let i=1; i<=numPages; i++) {
                await test.step(`Export results to ${library.format}`, async() => {
                    await pom.exportResults(i)
                    console.log(`[${name}] Page ${i}/${numPages} - Downloaded ${library.format}`)
                })
        
                if (await pom.nextPageButton.isVisible()) {
                    await pom.nextPageButton.click()
                } else {
                    console.log(`[${name}] Finished ${i}/${numPages}`)
                    break
                }
            }
        }
    
    })
}