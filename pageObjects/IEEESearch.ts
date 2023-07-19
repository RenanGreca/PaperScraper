import { expect, Page, Locator } from "@playwright/test";

export class IEEESearch {

    page: Page
    searchBar: Locator
    searchButton: Locator
    header: Locator
    numberOfHits: Locator

    yearFrom: Locator
    yearTo: Locator
    yearApplyButton: Locator
    publicationTopicsButton: Locator
    publicationTopicsField: Locator
    publicationTopicsCheckbox: Locator;
    publicationTopicsApplyButton: Locator;
    itemsPerPageButton: Locator;
    itemsPerPageDropdown: Locator;
    itemsPerPage100Option: Locator;
    matches: Locator;
    nextPageButton: Locator;
    selectAllCheckbox: Locator;
    exportButton: Locator;

    constructor(page: Page) {
        this.page = page
        this.searchBar = page.locator('input[type="search"]')
        this.searchButton = page.getByRole('button', {name: "Search"})
        this.header = page.locator('.Dashboard-header')
        this.numberOfHits = this.header.locator('span').locator('span').nth(1)
        
        this.yearFrom = page.locator('input.text-normal-md.u-font-smaller.ng-untouched.ng-pristine.ng-valid').first()
        this.yearTo = page.locator('input.text-normal-md.u-font-smaller.ng-untouched.ng-pristine.ng-valid').last()
        this.yearApplyButton = page.getByRole('button', {name: "Apply", exact: true}).and(
            page.locator(`[data-tealium_data='{"refinementName": "Year"}']`)
        )

        this.publicationTopicsButton = page.getByRole('button', {name: "Publication Topics"})
        this.publicationTopicsField = page.getByPlaceholder("Enter Topics")
        // this.publicationTopicsCheckbox = page.getByRole('checkbox', {name: "Enter search text"}).first()
        this.publicationTopicsApplyButton = page.getByRole('button', {name: "Apply", exact: true}).and(
            page.locator(`[data-tealium_data='{"refinementName": "Publication Topics"}']`)
        )

        this.itemsPerPageButton = page.getByRole('button', {name: "Items Per Page"})
        this.itemsPerPageDropdown = page.locator('div[aria-labelledby="dropdownPerPageLabel"]')
        this.itemsPerPage100Option = this.itemsPerPageDropdown.getByText('100')

        this.matches = page.locator('.List-results-items')
        this.selectAllCheckbox = page.getByRole('checkbox', {name: "Select All on Page"})

        this.nextPageButton = page.locator('.next-btn')

        this.exportButton = page.getByRole('button', {name: 'Export'})
    }

    async performQuery(url: string, query: string) {
        await this.page.goto(url)
        await this.searchBar.fill(query)
        await this.searchButton.click()

        const headerText = await this.header.textContent()
        expect(headerText).toContain(query)
    }

    async getNumberOfHits() {
        const numberOfHits = await this.numberOfHits.textContent()
        expect(numberOfHits).toBeTruthy()
        return numberOfHits
    }

    async filterByYear(start: string, end: string) {
        await this.yearFrom.fill(start)
        await this.yearTo.fill(end)
        await this.yearApplyButton.click()
    }

    async filterByPublicationTopics(topics: Array<string>) {
        await this.publicationTopicsButton.click()

        for (const topic of topics) {
            await this.publicationTopicsField.fill(topic)
            await this.publicationTopicsField.press('Enter')
            await this.page.waitForTimeout(200)

            await this.page.getByRole('checkbox', {name: topic}).first().click()
            // await this.publicationTopicsCheckbox.click()
            await this.publicationTopicsApplyButton.click()
        }
    }

    async increaseItemsPerPage() {
        await this.itemsPerPageButton.click()
        await this.itemsPerPage100Option.click()
        await expect.configure({timeout: 30000})(this.matches).toHaveCount(100)
    }

    async exportResults() {
        await this.exportButton.click()

        const downloadPromise = this.page.waitForEvent('download', {timeout: 5000})
        await this.exportButton.click()
        const download = await downloadPromise

        const csvPath = "./ieee1.csv"
        await download.saveAs(csvPath)
        
    }
}