import { test } from "./base"
import { expect } from "@playwright/test"
import csv2json from 'csvtojson'
// import { BibtexParser as bib2json } from 'bib2json'
const bib2json = require('bib2json')
import { readFileSync, statSync, writeFileSync, appendFileSync } from "node:fs"
import path from "path"
import { IEEE } from "../pageObjects/IEEESearch"
import { ACM } from "../pageObjects/ACMSearch"
import { Springer } from "../pageObjects/SpringerSearch"
import { Wiley } from "../pageObjects/WileySearch"
import { SemanticScholar, StandardJSON } from "../pageObjects/SemanticScholar"

test.describe.configure({ mode: 'serial' });

const libraries = [
    {
        name: "IEEE",
        format: "CSV",
        formatter: fromCSV,
        converter: ieee2json
    },
    {
        name: "ACM",
        format: "JSON",
        formatter: fromJSON,
        converter: acm2json
    },
    {
        name: "Springer",
        format: "CSV",
        formatter: fromCSV,
        converter: springer2json
    },
    {
        name: "Wiley",
        format: "Bib",
        formatter: fromBib,
        converter: wiley2json
    }
]

function removePunctuations(word: string) {
    return word.replace(/[^\w\s\']|_/g, "").toLowerCase().trim() //.replace(/[\!\.\,\?\-\?\'\"\‐]/gi, ' ').toLowerCase().trim();
};

function removePunctuationsAndSpaces(word: string) {
    return removePunctuations(word).replace(/ /g, '')
}
  

test(`Convert master list to JSON`, async( {page, request} ) => {
    const missingDOIsPath = path.resolve('downloads', 'missingDOIs.txt')
    const missingDOIs = readFileSync(missingDOIsPath).toString().split('\n')

    const filePath = path.resolve('downloads', `masterList.standard.json`)
    let masterList: StandardJSON[] = require(filePath)
    const existingRows = Object.keys(masterList).length + missingDOIs.length

    const json = await csv2json({delimiter: ","}).fromFile('master-list.csv')

    console.log(`[Semantic] Timeout: ${20+2*(json.length-existingRows)}s`)
    test.setTimeout((20+2*(json.length-existingRows))*1000) // 20s + 2s per row

    console.log(`[Semantic] Starting at row ${existingRows}`)

    for (let i=existingRows; i<json.length; i++) {

        await Promise.all([
            page.waitForTimeout(1000), // To avoid overloading the API, we make sure that each request is at least 1s apart.
            test.step(`[Semantic] ${i}/${json.length} - getting metadata for paper`, async() => {
                console.log(`[Semantic] ${i}/${json.length} - getting metadata for paper`)
                const row = json[i]
                const title = removePunctuations(row['Title'])
        
                console.log(`[Semantic] searching for "${title}"`)
        
                let url = `https://api.semanticscholar.org/graph/v1/paper/search?`
                url += `query=${encodeURIComponent(title)}`
                url += '&fields=title,authors,externalIds,abstract,publicationDate,year'
                url += '&limit=1'
        
                const response = await request.get(url, {
                    headers: {
                        'x-api-key': require('../semantic_scholar.json').api_key
                    }
                })

                expect(response).toBeTruthy()
                console.log(`[Semantic] API response status: ${response.status()}`)                 
        
                let responseJSON = await response.json()
                console.log(responseJSON)

                // expect(responseJSON.data).toHaveLength(1) // exactly one result
                // expect(removePunctuationsAndSpaces(responseJSON.title)).toEqual(removePunctuationsAndSpaces(title)) // result title matches search query

                try {
                    expect(responseJSON.data).toHaveLength(1) // exactly one result
                    expect(removePunctuationsAndSpaces(responseJSON.data[0].title)).toEqual(removePunctuationsAndSpaces(title)) // result title matches search query
                } catch {
                    console.error(`[Semantic] Paper not found for ${title}`)
                    appendFileSync(missingDOIsPath, `Paper not found for "${title}"\n`)
                    return
                }
                
                responseJSON = responseJSON.data[0]
                const doi = responseJSON.externalIds.DOI
        
                if (!doi) {
                    console.error(`[Semantic] DOI not found for ${title}`)
                    appendFileSync(missingDOIsPath, `DOI not found for "${title}"\n`)
                } else {
                    const paper: StandardJSON = {
                        title: responseJSON.title,
                        authors: responseJSON.authors.map(el => el.name),
                        date: responseJSON.publicationDate,
                        year: responseJSON.year,
                        abstract: responseJSON.abstract,
                        doi: doi,
                        publisher: '',
                        source: ['semantic-scholar']
                    }
            
                    masterList[doi] = paper
                    writeFileSync(filePath, JSON.stringify(masterList))
                }
            })
        ])
       
    }

    // const response = await request.get(url, {
    //     headers: {
    //         'x-api-key': require('../semantic_scholar.json').api_key
    //     }
    // })

    // console.log(await response.json())


    // const missingDOIsPath = path.resolve('downloads', 'missingDOIs.txt')
    // const missingDOIs = readFileSync(missingDOIsPath).toString().split('\n')
    // const filePath = path.resolve('downloads', `masterList.standard.json`)
    // let masterList: StandardJSON[] = require(filePath)
    // const existingRows = Object.keys(masterList).length + missingDOIs.length
    // const json = await csv2json({delimiter: ","}).fromFile('master-list.csv')

    // const pom = new SemanticScholar(page)
    // await pom.load()

    // console.log(`[Semantic] Timeout: ${20*(json.length-existingRows)}s`)
    // test.setTimeout(20*1000*(json.length-existingRows)) // 20 secs per row

    // // let jsons: StandardJSON[] = []
    // for (let i=existingRows; i<json.length; i++) {
    //     console.log(`[Semantic] ${i}/${json.length} - getting metadata for paper`)
    //     const row = json[i]
    //     const title = row['Title']
    //     const result = await pom.search(title)
    //     if (!result.doi) {
    //         console.error(`[Semantic] DOI not found for ${title}`)
    //         appendFileSync(missingDOIsPath, `DOI not found for "${title}"\n`)
    //     } else {
    //         masterList[result.doi] = result
    //         writeFileSync(filePath, JSON.stringify(masterList))
    //     }
    // }

})

test.describe(`Convert formats to JSON`, async() => {
    for (const library of libraries) {
        test(`Converting output of ${library.name} to JSON`, async() => {
            let i = 1
            let filePath = path.resolve('downloads', `${library.name.toLowerCase()}${i}.${library.format.toLowerCase()}`)
            let jsons: any[] = []
            // let stat = statSync(filePath)
            while (exists(filePath)) {
                console.log(`[${library.name}] ${i} - reading ${library.name.toLowerCase()}${i}.${library.format.toLowerCase()}.`)
                const json = await library.formatter(filePath)
                jsons = jsons.concat(json)
                i += 1
                filePath = path.resolve('downloads', `${library.name.toLowerCase()}${i}.${library.format.toLowerCase()}`)
            }

            console.log(`${library.name} Converting to standardized JSON`)
            const standardjson = library.converter(jsons)

            console.log(`${library.name} Saving standardized JSON to ${library.name.toLowerCase()}.standard.json`)
            filePath = path.resolve('downloads', `${library.name.toLowerCase()}.standard.json`)
            writeFileSync(filePath, JSON.stringify(standardjson))
        })
    }

    test.afterAll(async() => {
        let jsons: StandardJSON[] = []

        for (const library of libraries) {
            const filePath = path.resolve('downloads', `${library.name.toLowerCase()}.standard.json`)
            if (!exists(filePath)) {
                console.error(`[${library.name}] standardized JSON not found at path ${filePath}.`)
                continue
            }
            const json = require(filePath)
            jsons = jsons.concat(json)
        }

        let i = 0
        let duplicates = 0
        let combined = {}
        for (const row of jsons) {
            if (row.doi) {
                if (combined[row.doi]) {
                    // console.log(`Found Duplicate`)
                    combined[row.doi].source = combined[row.doi].source.concat(row.source)
                    duplicates += 1
                } else {
                    combined[row.doi] = row
                    i += 1
                }
            } else {
                if (combined[row.title]) {
                    // console.log(`Found Duplicate`)
                    combined[row.title].source = combined[row.title].source.concat(row.source)
                    duplicates += 1
                } else {
                    combined[row.title] = row
                    i += 1
                }
            }
        }

        console.log(`Extracted ${i} items with ${duplicates} duplicates.`)
        const filePath = path.resolve('downloads', `combined.standard.json`)
        writeFileSync(filePath, JSON.stringify(combined))
    })
})

function exists(path: string) : boolean {
    try {
        statSync(path)
        return true
    } catch {
        return false
    }
}

async function fromCSV(path: string): Promise<any[]> { 
    return await csv2json({delimiter: ","}).fromFile(path)
}

async function fromBib(path: string): Promise<any[]> {
    const text = readFileSync(path).toString()
    return bib2json(text).entries
}

async function fromJSON(path: string): Promise<any[]> {
    return require(path).items
}

function ieee2json(json: IEEE[]): StandardJSON[] {
    let result: StandardJSON[] = []

    for (const row of json) {
        const item = {
            title: row["Document Title"],
            authors: row.Authors.split('; '),
            date: row["Date Added To Xplore"],
            year: row["Publication Year"],
            abstract: row.Abstract,
            doi: row.DOI,
            publisher: row.Publisher,
            source: ['ieee']
        }
        result.push(item)
    }

    return result
}

function acm2json(json: any[]): StandardJSON[] {
    let result: StandardJSON[] = []

    for (const element of json) {
        const row: ACM = Object.entries(element)[0][1] as ACM
        // const row: ACM = a[1]
        if (!row.DOI) {
            console.error(`[ACM] DOI is undefined for article ${row.title.trim()}`)
            continue
        }
        if (!row.author) {
            console.error(`[ACM] Authors are undefined for ${row.DOI}`)

            row.author = [{family: '', given: ''}]
            // continue
        }
        const item = {
            title: row.title,
            authors: row.author.map(el => `${el.family}, ${el.given}`),
            date: row.issued["date-parts"].map(el => `${el[0]}-${el[1]}-${el[2]}`)[0],
            year: row.issued["date-parts"][0][0].toString(),
            abstract: row.abstract,
            doi: row.DOI,
            publisher: row.publisher,
            source: ['acm']
        }
        result.push(item)
    }

    return result
}

function springer2json(json: Springer[]): StandardJSON[] {
    let result: StandardJSON[] = []

    for (const row of json) {
        const item = {
            title: row["Item Title"],
            authors: [row.Authors],
            date: '',
            year: row["Publication Year"],
            abstract: '',
            doi: row["Item DOI"],
            publisher: '',
            source: ['springer']
        }
        result.push(item)
    }

    return result
}

function wiley2json(json: Wiley[]): StandardJSON[] {
    let result: StandardJSON[] = []

    for (const row of json) {
        if (!row.Fields.author) {
            console.error(`[Wiley] Authors are undefined for ${row.Fields.doi}`)
            row.Fields.author = ''
            // continue
        }

        const item = {
            title: row.Fields.title,
            authors: row.Fields.author.split(' and '),
            date: '',
            year: row.Fields.year,
            abstract: row.Fields.abstract,
            doi: row.Fields.doi.replace('https://doi.org/', ''),
            publisher: '',
            source: ['wiley']
        }
        result.push(item)
    }

    return result
}