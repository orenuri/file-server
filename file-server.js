const fs = require('fs')
const path = require('path')
const express = require('express')
const multer = require('multer')
const serveIndex = require('serve-index')

const app = express()
const port = process.env.PORT || 8060

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
        cb(null, './upload')
    },
    filename: function (req, file, cb) {
        const uploadedFileName = updateFileName(file.originalname, './upload')
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
    const uploadedFileName = updateFileName(req.params._filename, './upload')
    console.log('PUT file upload/'+req.params._filename+' saved as upload/' + uploadedFileName)
    try {
        var diskStream = fs.createWriteStream(path.join('./upload', uploadedFileName))
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


app.get('/upload/:_filename', async (req, res, next) => {
    const filePath = './upload/' + req.params._filename
    if(!fs.existsSync(filePath)) {
        return res.status(404).send()
    }
    console.log('GET file:'+filePath)
    res.download(filePath)
})

app.use('/upload', express.static('./upload'), serveIndex('./upload', { 'icons': true }))

app.listen(port, () => {
    console.log("server is running on port:" + port)
})
