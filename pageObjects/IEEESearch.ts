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
    downloadButton: Locator;
    paginationButtons: Locator;
    cancelButton: Locator;
    dismissCookiesButton: Locator;

    constructor(page: Page) {
        this.page = page

        this.dismissCookiesButton = page.getByText('Accept & Close')

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

        this.paginationButtons = page.locator('.pagination-bar')

        this.exportButton = page.getByRole('button', {name: 'Export'})
        this.downloadButton = page.getByRole('button', {name: 'Download'})
        this.cancelButton = page.getByRole('button', {name: 'Cancel'})
    }

    async performQuery(
            url: string, query: string,
            startYear: Number, endYear: Number,
            params: {publicationTopics?: string[]}
        ) {
        let queryURL = url
        queryURL += query
        if (params?.publicationTopics) {
            for (const topic of params.publicationTopics) {
                queryURL += `&refinements=ControlledTerms:${topic}`
            }
        }
        queryURL += `&ranges=${startYear}_${endYear}_Year`
        

        await this.page.goto(queryURL)
        try {
            await this.dismissCookiesButton.click()
        } catch {}
    }

    async getNumberOfHits() {
        const resultCount = await this.numberOfHits.textContent()
        const numberOfHits = Number(resultCount?.replace(/\D/g,''))
        expect(numberOfHits).toBeTruthy()
        return numberOfHits
    }

    async filterByYear(start: Number, end: Number) {
        await this.yearFrom.fill(start.toString())
        await this.yearTo.fill(end.toString())
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

    async exportResults(i: Number = 1) {
        await this.selectAllCheckbox.click()

        await this.exportButton.click()

        const downloadPromise = this.page.waitForEvent('download', {timeout: 5000})
        await this.downloadButton.click()
        const download = await downloadPromise

        const csvPath = `./downloads/ieee${i}.csv`
        await download.saveAs(csvPath)

        // await this.cancelButton.click()
        
    }
}