import { expect, Page, Locator } from "@playwright/test";
import { writeFileSync } from 'fs';

export class ACMSearch {
    page: Page;
    resultCount: Locator;
    itemsPerPage50Button: Locator;
    selectAllCheckbox: Locator;
    exportButton: Locator;
    allResultsButton: Locator;
    downloadButton: Locator;
    downloadNowButton: Locator;
    dismissCookiesButton: Locator;
    nextPageButton: Locator;
    closeExportButton: Locator;

    constructor(page: Page) {
        this.page = page

        this.dismissCookiesButton = page.getByRole('link', {name: 'Use necessary cookies only'})

        this.resultCount = page.locator('.result__count')

        this.itemsPerPage50Button = page.locator('.per-page').getByText('50')

        this.selectAllCheckbox = page.locator('.item-results__checkbox')

        this.exportButton = page.getByRole('link', {name: 'Export Citations'})
        this.allResultsButton = page.locator('#allResults')
        this.downloadButton = page.getByRole('link', {name: 'Download'})
        // this.downloadButton = page.getByRole('link', {name: "Download citation"})
        this.downloadNowButton = page.getByRole('link', {name: 'Download now!'})
        this.closeExportButton = page.getByRole('button', { name: 'Close modal' })
        this.nextPageButton = page.locator('.pagination__btn--next')
    }

    async performQuery(url: string, query: string, 
        afterYear: Number, beforeYear: Number,
        params: {}) {
        
        let queryURL = url
        queryURL += query
        queryURL += `&AfterMonth=1&AfterYear=${afterYear}`
        queryURL += `&BeforeMonth=7&BeforeYear=${beforeYear}`
        

        await this.page.goto(queryURL)
        try {
            await this.dismissCookiesButton.click()
        } catch {}
    }

    async getNumberOfHits() {
        const resultCount = await this.resultCount.textContent()
        const numberOfHits = Number(resultCount?.replace(/\D/g,''))
        expect(numberOfHits).toBeGreaterThan(0)
        return numberOfHits
    }

    async increaseItemsPerPage() { 
        await this.itemsPerPage50Button.click()
    }

    async exportResults(i: Number = 1) {
        // await this.selectAllCheckbox.click()
        // await this.exportButton.waitFor()

        await expect(async() => {
            await this.selectAllCheckbox.click()
            await expect.configure({timeout: 500})(this.exportButton).toBeVisible()
        }).toPass()

        await this.exportButton.click()

        const response = await this.page.waitForResponse(response => response.url().includes('exportCiteProcCitation') && response.status() === 200);
        let json = await response.json()
        console.log(`[ACM] Number of results in response: ${json.items.length}`)
        console.log(`[ACM] Writing to file downloads/acm${i}.json`)

        writeFileSync(`./downloads/acm${i}.json`, JSON.stringify(json))

        await this.closeExportButton.click()
        // await this.allResultsButton.click()
        // const dataURL = await this.downloadButton.getAttribute('data-href')
        // const newURL = baseURL + dataURL
        // await this.page.goto(newURL)


        // await this.downloadButton.click()
        // // await this.downloadNowButton.waitFor({timeout: 60*1000})
        // await this.page.getByText('Your file of search results citations is now ready.').waitFor({timeout: 5*60*1000})
        // // await expect.configure({timeout: 60*1000})(this.downloadNowButton).toBeEnabled()

        // const downloadPromise = this.page.waitForEvent('download', {timeout: 5000})
        // await this.downloadNowButton.click()
        // const download = await downloadPromise

        // const bibPath = `./downloads/acm${i}.bib`
        // await download.saveAs(bibPath)
    }
}