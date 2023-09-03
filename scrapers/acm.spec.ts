import acm from "../configs/acm.json"
import { test } from "./base"
import { ACMSearch } from "../pageObjects/ACMSearch"

test(`Perform search in ACM`, async({page, dateRange}) => {
    test.slow()

    const acmPOM = new ACMSearch(page)

    await test.step(`Initial search`, async() => {
        await acmPOM.performQuery(acm.url, acm.query, dateRange.startYear, dateRange.endYear)
        const numberOfHits = await acmPOM.getNumberOfHits()
        console.log(`(1) Initial nº of results: ${numberOfHits}`)
    })

    await test.step(`Increase results per page`, async() => {
        
        console.log(`Increase results per page`)
    })
})