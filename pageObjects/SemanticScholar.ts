import { expect, Page, Locator } from "@playwright/test"

export type StandardJSON = {
    title: string,
    authors: string[],
    date: string
    year: string
    abstract: string
    doi: string
    publisher: string
    source: string[]
}

export class SemanticScholar {
    page: Page
    searchBar: Locator
    searchButton: Locator
    firstResult: Locator

    title: Locator
    authors: Locator
    date: Locator
    abstract: Locator
    doi: Locator
    authorListExpand: Locator
    expandAbstract: Locator
    dismissCookiesButton: Locator
    dismissGoogleButton: Locator

    constructor(page: Page) {
        this.page = page

        this.dismissCookiesButton = page.getByRole('button', { name: 'ACCEPT & CONTINUE' })
        this.dismissGoogleButton = page.locator('#credential_picker_container').frameLocator('iframe').locator('#close')
 
        this.searchBar = page.locator('.search-bar__input')
        this.searchButton = page.locator('[data-test-id="search__form-submit"]')
        
        this.firstResult = page.locator('.cl-paper-title').first()

        this.title = page.locator('[data-test-id="paper-detail-title"]')
        this.authors = page.locator('.author-list')
        this.date = page.locator('[data-test-id="paper-year"]')
        this.abstract = page.locator('[data-test-id="no-highlight-abstract-text"]')
        this.doi = page.locator('.doi__link')
        // this.publisher = '

        this.authorListExpand = page.locator('[data-test-id="author-list-expand"]').first()
        this.expandAbstract = page.locator('.cl-button__label')
    }

    async load() {
        await this.page.goto('https://www.semanticscholar.org/search')

        await this.page.locator('.error-message__main-text').waitFor()

        await this.dismissGoogleButton.click()
        await this.dismissCookiesButton.click()
    }

    async search(title: string): Promise<StandardJSON> {
        await this.searchBar.fill(title)
        await this.searchButton.click()
        await this.firstResult.waitFor() // .toContainText(title, {ignoreCase: true})

        await this.firstResult.click()

        await this.title.waitFor() //.toContainText(title, {ignoreCase: true})

        let titlestring
        try {
            titlestring = await this.title.textContent()
        } catch { }

        try { 
            await this.authorListExpand.click({ timeout: 500 })
        } catch { }
        let authors = await this.authors.textContent()

        let date = await this.date.textContent()

        let abstract
        try { 
            await this.expandAbstract.click({ timeout: 500 })
            abstract = await this.abstract.textContent()
        } catch { }

        let doi
        try {
            doi = await this.doi.textContent({ timeout: 500 })
        } catch { }

        const paper: StandardJSON = {
            title: titlestring,
            authors: authors.split(',').map(el => el.replace('less', '').trim()),
            date: new Date("1 May 2017").toISOString().split('T')[0],
            year: '',
            abstract: abstract,
            doi: doi,
            publisher: '',
            source: ['semantic-scholar']
        }

        return paper

    }
}