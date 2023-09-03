import ieee from "../configs/ieee.json";
import { test } from "./base";
import { IEEESearch } from "../pageObjects/IEEESearch";

test(`Perform search in IEEE`, async ({ page, dateRange }) => {
    test.slow()

    const ieeePOM = new IEEESearch(page)

    await test.step('Initial search', async() => {
        await ieeePOM.performQuery(ieee.url, ieee.query, dateRange.startYear, dateRange.endYear, ieee.publicationTopics)
        const numberOfHits = await ieeePOM.getNumberOfHits()
        console.log(`(1) Initial nº of results: ${numberOfHits}`)
    })

    // await test.step('Filter results by year', async() => {
    //     await ieeePOM.filterByYear(dateRange.startYear, dateRange.endYear)
    //     const numberOfHits = await ieeePOM.getNumberOfHits()
    //     console.log(`(2) Nº of results filtered by year: ${numberOfHits}`)
    // })

    // await test.step('Filter results by publication topic', async() => {
    //     await ieeePOM.filterByPublicationTopics(ieee.publicationTopics)
    //     const numberOfHits = await ieeePOM.getNumberOfHits()
    //     console.log(`(3) Nº of results filtered by publication topic: ${numberOfHits}`)
    // })

    // await test.step('Increase number of results per page', async() => {
    //     await ieeePOM.increaseItemsPerPage()
    //     console.log(`(4) Set items per page to 100`)
    // })

    let i = 1
    do {
        await test.step('Select all results in page', async() => {
            await ieeePOM.selectAllCheckbox.click()
            console.log(`(5.${i}) Selected all results in page`)
        })
    
        await test.step('Export results to CSV', async() => {
            await ieeePOM.exportResults(i)
            console.log(`(6.${i}) Downloaded CSV`)
            i += 1
        })

        if (await ieeePOM.nextPageButton.isVisible()) {
            await ieeePOM.nextPageButton.click()
        } else {
            break
        }
    } while (true)

})