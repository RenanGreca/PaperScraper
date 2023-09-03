import { test } from "./base"
import csv2json from 'csvtojson'
// import { BibtexParser as bib2json } from 'bib2json'
const bib2json = require('bib2json')
import { readFileSync, statSync, writeFileSync } from "node:fs"
import path from "path"

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

type StandardJSON = {
    title: string,
    authors: string[],
    date: string
    year: string
    abstract: string
    doi: string
    publisher: string
    source: string[]
}

type IEEE = {
    "Document Title": string,
    Authors: string,
    "Author Affiliations": string,
    "Publication Title": string,
    "Date Added To Xplore": string,
    "Publication Year": string,
    Volume: string,
    Issue: string,
    "Start Page": string,
    "End Page": string,
    Abstract: string,
    ISSN: string,
    ISBNs: string,
    DOI: string,
    "Funding Information": string,
    "PDF Link": string,
    "Author Keywords": string,
    "IEEE Terms": string,
    "INSPEC Controlled Terms": string,
    "INSPEC Non-Controlled Terms": string,
    Mesh_Terms: string,
    "Article Citation Count": string,
    "Patent Citation Count": string,
    "Reference Count": string,
    License: string,
    "Online Date": string,
    "Issue Date": string,
    "Meeting Date": string,
    Publisher: string,
    "Document Identifier": string,
}

type ACM = {
    id: string,
    type: string,
    author: {
        family: string,
        given: string,
      }[],
    accessed: any,
    issued: {
      "date-parts": Number[][],
    },
    "original-date": {
      "date-parts": Number[][],
    },
    abstract: string,
    "call-number": string,
    "collection-title": string,
    "container-title": string,
    DOI: string,
    "event-place": string,
    ISBN: string,
    keyword: string,
    "number-of-pages": string,
    page: string,
    publisher: string,
    "publisher-place": string,
    title: string,
    URL: string,
}

type Springer = {
    "Item Title": string,
    "Publication Title": string,
    "Book Series Title": string,
    "Journal Volume": string,
    "Journal Issue": string,
    "Item DOI": string,
    Authors: string,
    "Publication Year": string,
    URL: string,
    "Content Type": string,
}

type Wiley = {
    ObjectType: string,
    EntryType: string,
    EntryKey: string,
    Fields: {
      author: string,
      title: string,
      journal: string,
      volume: string,
      number: string,
      pages: string,
      keywords: string,
      doi: string,
      url: string,
      eprint: string,
      note: string,
      abstract: string,
      year: string,
    },
  }

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
            console.error(`[ACM] DOI is undefined for article of type ${row.type.trim()}`)
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