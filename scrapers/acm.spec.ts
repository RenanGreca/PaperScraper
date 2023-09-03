// import acm from "../configs/acm.json"
// import { test } from "./base"
// import { ACMSearch } from "../pageObjects/ACMSearch"

// test(`Perform search in ACM`, async({page, dateRange}) => {
//     test.setTimeout(5*60*1000)

//     const acmPOM = new ACMSearch(page)

//     const numberOfHits = await test.step(`Initial search`, async() => {
//         await acmPOM.performQuery(acm.url, acm.query, dateRange.startYear, dateRange.endYear)
//         const numberOfHits = await acmPOM.getNumberOfHits()
//         console.log(`[ACM] Nº of results: ${numberOfHits}`)
//         return numberOfHits
//     })

//     const numPages = Math.ceil(numberOfHits/acm.pageSize)

//     for(let i=1; i<=numPages; i++) {
//         await test.step(`Page ${i}: Export results to BibTeX`, async() => {
//             await acmPOM.exportResults(i)
//             console.log(`[ACM] Page ${i}/${numPages} - Export results to BibTeX`)
//         })

//         if (await acmPOM.nextPageButton.isVisible()) {
//             await acmPOM.nextPageButton.click()
//         } else {
//             console.log(`[ACM] Finished ${i}/${numPages}`)
//             break
//         }
//     }

    
// })