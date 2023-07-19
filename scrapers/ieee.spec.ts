import ieee from "../configs/ieee.json";
import { expect, test } from "@playwright/test";
import { IEEESearch } from "../pageObjects/IEEESearch";

test(`Perform search in IEEE`, async ({ page }) => {
    test.slow()

    const ieeePOM = new IEEESearch(page)

    await test.step('Initial search', async() => {
        await ieeePOM.performQuery(ieee.url, ieee.query)
        const numberOfHits = await ieeePOM.getNumberOfHits()
        console.log(`(1) Initial nº of results: ${numberOfHits}`)
    })

    await test.step('Filter results by year', async() => {
        await ieeePOM.filterByYear(ieee.start_year, ieee.end_year)
        const numberOfHits = await ieeePOM.getNumberOfHits()
        console.log(`(2) Nº of results filtered by year: ${numberOfHits}`)
    })

    await test.step('Filter results by publication topic', async() => {
        await ieeePOM.filterByPublicationTopics(ieee.publication_topics)
        const numberOfHits = await ieeePOM.getNumberOfHits()
        console.log(`(3) Nº of results filtered by publication topic: ${numberOfHits}`)
    })

    await test.step('Increase number of results per page', async() => {
        await ieeePOM.increaseItemsPerPage()
        console.log(`(4) Set items per page to 100`)
    })

    await test.step('Select all results in page', async() => {
        await ieeePOM.selectAllCheckbox.click()
        console.log(`(5) Selected all results in page`)
    })

    await test.step('Export results to CSV', async() => {
        await ieeePOM.exportResults()
        console.log(`(6) Downloaded CSV`)
    })



})