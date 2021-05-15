const { ApolloServer } = require('apollo-server')
const fs = require('fs')
const sharp = require('sharp')
const data = require('./data.json')
const filesPath = './files'

const typeDefs = `

    type Art {
        id: ID!
        file: String!
        thumbnail: String!
        category: String
        title: String
        description: String
    }

    type Query {
        arts (category: String): [Art]
        art (id: ID!): Art
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

if (fs.existsSync('./thumbs')) fs.rmdirSync('./thumbs', { recursive: true })
fs.mkdirSync('./thumbs')

data.meta.forEach((file, idx) => {
    const asset = files.find(f => f.path === `${ filesPath }/${ file.path }`)
    if (asset) {

        sharp(`${ filesPath }/${ file.path }`).resize(200, 200).toFile(`./thumbs/${ idx + 1 }`, (err) => {
            if (err) console.log(err)
            else arts.push({
                id: file.id,
                file: asset.file,
                thumbnail: fs.readFileSync(`./thumbs/${ idx + 1 }`).toString('base64'),
                category: file.category,
                title: file.title,
                description: file.description
            })
        })
        
    }
    
})

const resolvers = {
    Query: {
        arts(_, args) {
            return args.category ? arts.filter(art => art.category === args.category) : arts
        },
        art(_, args) {
            return arts.find(art => art.id == args.id)
        }
    }
}

const server = new ApolloServer({ typeDefs, resolvers })
server.listen({ port: 4006 })