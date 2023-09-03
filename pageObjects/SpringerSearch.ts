import { expect, Page, Locator } from "@playwright/test";``

export class SpringerSearch {
    page: Page
    dismissCookiesButton: Locator;
    resultCount: Locator;
    nextPageButton: Locator;
    downloadButton: Locator;

    constructor(page: Page) {
        this.page = page
        
        this.dismissCookiesButton = page.getByRole('button', {name: "Accept all cookies"})

        this.resultCount = page.locator('#number-of-search-results-and-search-terms').locator('strong').first()

        this.downloadButton = page.getByRole('link').filter({ hasText: "Download search results (CSV)"})

    }

    async performQuery(
        url: string, query: string,
        startYear: Number, endYear: Number,
        params: {
                    discipline?: string[]
                    subDiscipline? : string[],
                }
    ) {
        let queryURL = url
        queryURL += query
        if (params?.discipline) {
            for (const topic of params.discipline) {
                queryURL += `&facet-discipline=${topic}`
            }
        }
        if (params?.subDiscipline) {
            for (const topic of params.subDiscipline) {
                queryURL += `&facet-sub-discipline=${topic}`
                queryURL += `&just-selected-from-overlay-value=${topic}`
            }
        }
        queryURL += `&facet-start-year=${startYear}`
        queryURL += `&facet-end-year=${endYear}`
        

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

    async exportResults() {
        const downloadPromise = this.page.waitForEvent('download', {timeout: 5000})
        await this.downloadButton.click()
        const download = await downloadPromise

        const csvPath = `./downloads/springer1.csv`
        await download.saveAs(csvPath)
    }
}