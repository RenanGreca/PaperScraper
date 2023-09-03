import { expect, Page, Locator } from "@playwright/test";``

export class WileySearch {
    page: Page
    dismissCookiesButton: Locator;
    resultCount: Locator;
    nextPageButton: Locator;
    downloadButton: Locator;
    exportButton: Locator;
    checkboxes: Locator;
    selectionCount: Locator;
    nextButton: Locator;
    bibtexButton: Locator;
    closeExportButton: Locator;


    constructor(page: Page) {
        this.page = page
        
        this.dismissCookiesButton = page.getByRole('button', {name: "Accept All"})

        this.resultCount = page.locator('.result__count')
        this.selectionCount = page.locator('.selection-count__details')

        this.exportButton = page.getByRole('link', { name: "Export Citation(s)"})
        this.checkboxes = page.locator('.checkbox--primary')
        this.nextButton = page.getByRole('button', {name: "Next"})

        this.bibtexButton = page.locator('label').filter({ hasText: 'BibTex' })
        this.downloadButton = page.getByRole('button', {name: "Export", exact: true})

        this.nextPageButton = page.locator('.pagination__btn--next')
        this.closeExportButton = page.getByRole('button', { name: "close"})
    }

    async performQuery(
        url: string, query: string,
        startYear: Number, endYear: Number,
        params: { }
    ) {
        let queryURL = url
        queryURL += query
        queryURL += `&AfterYear=${startYear}`
        queryURL += `&BeforeYear=${endYear}`
        

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

    async exportResults(i: Number = 1) {
        await this.exportButton.click()
        expect(this.checkboxes).not.toHaveCount(0)
        const numHits = await this.checkboxes.count()
        // expect(this.checkboxes).toHaveCount(numHits)
        for (const checkbox of (await this.checkboxes.all())) {
            await checkbox.check()
        }
        expect(this.selectionCount).toContainText(`${numHits} of ${numHits}`)
        await this.nextButton.click()

        await this.bibtexButton.check()

        const downloadPromise = this.page.waitForEvent('download', {timeout: 5000})
        await this.downloadButton.click()
        const download = await downloadPromise

        const csvPath = `./downloads/wiley${i}.bib`
        await download.saveAs(csvPath)

        await this.closeExportButton.click()
    }
}

