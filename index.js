const { ApolloServer } = require('apollo-server')
const fs = require('fs')
const data = require('./data.json')
const filesPath = './files'

const typeDefs = `

    type Art {
        id: ID!
        file: String!
        category: String
        title: String
        description: String
    }

    type Query {
        arts: [Art]
    }

`

const find = path => {
    const dir = fs.readdirSync(path)
    let result = []
    dir.forEach(child => {
        if (fs.lstatSync(`${ path }/${ child }`).isDirectory()) {
            result = result.concat(find(`${ path }/${ child }`))
        } else {
            result.push({
                path: `${ path }/${ child }`,
                file: fs.readFileSync(`${ path }/${ child }`).toString('base64')
            })
        }
    })
    return result
}

const files = find(filesPath)
const arts = []

data.meta.forEach((file, idx) => {
    const asset = files.find(f => f.path === `${ filesPath }/${ file.path }`)
    if (asset) {
        arts.push({
            id: idx + 1,
            file: asset.file,
            category: file.category,
            title: file.title,
            description: file.description
        })
    }
})

const resolvers = {
    Query: {
        arts() {
            return arts
        }
    }
}

const server = new ApolloServer({ typeDefs, resolvers })
server.listen()