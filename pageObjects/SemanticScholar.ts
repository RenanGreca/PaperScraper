import { expect, Page, Locator, request } from "@playwright/test"
const similarity = require('string-cosine-similarity')


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

    async search(title: string): Promise<[StandardJSON?, string?]> {
        title = removePunctuations(title)
        console.log(`[Semantic] searching for "${title}"`)
        
        let url = `https://api.semanticscholar.org/graph/v1/paper/search?`
        url += `query=${encodeURIComponent(title)}`
        url += '&fields=title,authors,externalIds,abstract,publicationDate,year,publicationVenue'
        url += '&limit=1'

        const context = await request.newContext()
        const response = await context.get(url, {
            headers: {
                'x-api-key': require('../semantic_scholar.json').api_key
            }
        })

        expect(response).toBeTruthy()
        // console.log(`[Semantic] API response status: ${response.status()}`)                 

        let responseJSON = await response.json()
        // console.log(responseJSON)
        
        try {
            expect(responseJSON.data).toHaveLength(1) // exactly one result
            const cleantitleAPI = removePunctuationsAndSpaces(responseJSON.data[0].title)
            const cleantitleCSV = removePunctuationsAndSpaces(title)
            if (cleantitleAPI != cleantitleCSV) {
                console.error(`[Semantic] Mismatched titles:`)
                console.error(`[Semantic] API: ${cleantitleAPI}`)
                console.error(`[Semantic] CSV: ${cleantitleCSV}`)
                console.error(`[Semantic] Cosine similarity: ${similarity(responseJSON.data[0].title, title)}`)
                expect(similarity(responseJSON.data[0].title, title)).toBeGreaterThan(0.9)
                console.log(`[Semantic] Similarity > 0.9, assuming correct match.`)
            }
            // expect(removePunctuationsAndSpaces(responseJSON.data[0].title)).toEqual(removePunctuationsAndSpaces(title)) // result title matches search query
        } catch {
            const err = `Paper not found for "${title}"`
            return Promise.resolve([undefined, err])
        }

        responseJSON = responseJSON.data[0]
        const doi = responseJSON.externalIds.DOI

        if (!doi) {
            const err = `DOI not found for "${title}"`
            return Promise.resolve([undefined, err])
        }
        const paper: StandardJSON = {
            title: responseJSON.title,
            authors: responseJSON.authors.map(el => el.name),
            date: responseJSON.publicationDate,
            year: responseJSON.year,
            abstract: responseJSON.abstract,
            doi: doi,
            publisher: responseJSON.publicationVenue.name,
            source: ['semantic-scholar']
        }

        return Promise.resolve([paper, undefined])

    }
}

function removePunctuations(word: string) {
    return word.replace(/[\!\.\,\?\-\‐\/]/gi, ' ').replace(/[^\w\s]|_/g, "").toLowerCase().trim() //.replace(/[\!\.\,\?\-\?\'\"\‐]/gi, ' ').toLowerCase().trim();
};

function removePunctuationsAndSpaces(word: string) {
    return removePunctuations(word).replace(/ /g, '')
}