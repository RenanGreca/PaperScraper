import { expect, Page, Locator } from "@playwright/test";

export class ACMSearch {
    page: Page;
    resultCount: Locator;
    itemsPerPage50Button: Locator;

    constructor(page: Page) {
        this.page = page

        this.resultCount = page.locator('.result__count')

        this.itemsPerPage50Button = page.locator('.per-page').getByText('50')
    }

    async performQuery(url: string, query: string, 
        afterYear: Number, beforeYear: Number) {
        
        let queryURL = url
        queryURL += query
        queryURL += `&AfterMonth=1&AfterYear=${afterYear}`
        queryURL += `&BeforeMonth=7&BeforeYear=${beforeYear}`
        

        await this.page.goto(queryURL)
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
}