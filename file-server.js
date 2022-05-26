const fs = require('fs')
const path = require('path')
const express = require('express')
const multer = require('multer')
const serveIndex = require('serve-index')

const app = express()
const port = process.env.PORT || 8060
const basePath='./upload'

const updateFileName = (filename, filePath) => {
    parsedFile = path.parse(filename)
    currFileName = parsedFile.name
    while(fs.existsSync(filePath+ '/' + currFileName + parsedFile.ext)) {
        // if(currFileName.match(/\([0-9]*\)$/)) {
        // }
        currFileName = currFileName+'_'+(Date.now())
    }
    return currFileName+parsedFile.ext
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, basePath)
    },
    filename: function (req, file, cb) {
        const uploadedFileName = updateFileName(file.originalname, basePath)
        req.uploadedFileName = uploadedFileName
        cb(null, uploadedFileName)
    }
})

const uploadFiles = multer({ storage })

app.post('/upload', uploadFiles.single('upload'), (req, res) => {
    console.log('POST file upload/'+req.file.originalname+' saved as upload/' + req.uploadedFileName)
    res.send()
})

app.put('/upload/:_filename', async (req, res, next) => {
    const uploadedFileName = updateFileName(req.params._filename, basePath)
    console.log('PUT file upload/'+req.params._filename+' saved as upload/' + uploadedFileName)
    try {
        var diskStream = fs.createWriteStream(path.join(basePath, uploadedFileName))
        req.pipe(diskStream)
            .on('finish', () => {
                console.log('finished saving file')
                res.send('Done')
            })
            .on('close', () => console.log('close stream'))
            .on('end', () => console.log('end stream'))
            .on('error', (err) => console.log('error'+err))
    } catch(e) {
        res.status(400).send(e)
    }
})

app.delete('/upload/allFiles', async (req, res, next) => {
    let count = 0
    try {
        let files = fs.readdirSync(basePath);
        files.forEach(file => {
            count++
            const filePath = path.join(basePath, file);
            console.log('DELETE file:'+filePath)
            fs.unlink(filePath, (err => {
                if (err) console.log(err);
            }));
        })
    } catch(e) {
        console.log(e)
    }
    res.send(`Removed ${count} files`)
})

app.delete('/upload/:_filename', async (req, res, next) => {
    let filePath = './upload/'
    filePath += req.params._filename
    if(!fs.existsSync(filePath)) {
        return res.status(404).send(`File ${req.params._filename} not found`)
    }
    console.log('DELETE file:'+filePath)
    fs.unlink(filePath, (err => {
        if (err) console.log(err);
    }));
    res.send('Done')
})

app.get('/upload/listFiles', async (req, res, next) => {
    let fileList = []
    try {
        let files = fs.readdirSync(basePath);
        files.forEach(file => {
            fileList.push(file);
        })
    } catch(e) {
        return res.status(404).send(e)
    }
    res.send(fileList)
})

app.get('/upload/:_filename', async (req, res, next) => {
    const filePath = path.join(basePath, req.params._filename)
    if(!fs.existsSync(filePath)) {
        return res.status(404).send()
    }
    console.log('GET file:'+filePath)
    res.download(filePath)
})

app.use('/upload', express.static(basePath), serveIndex(basePath, { 'icons': true , 'view' :'details'}))

app.listen(port, () => {
    console.log("server is running on port:" + port)
})

function getFilesInDirectory(filePath) {
    console.log("\nFiles present in directory:");
    try {
        let files = fs.readdirSync(filePath);
        files.forEach(file => {
            console.log(file);
        })
    } catch(e) {
        console.log(e)
    }
  }