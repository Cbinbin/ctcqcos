const COS = require('cos-nodejs-sdk-v5')
  , crypto = require('crypto')
  , multer = require('multer')
  , fs = require('fs')

class Qcos {
  constructor(mainParams, otherParams) {
    let otherParamsKey = otherParams ? Object.keys(otherParams) : []
      , mainParamsKey = mainParams ? Object.keys(mainParams) : []
      , cosParams = {}
    mainParamsKey.concat(otherParamsKey).forEach((itemKey, index)=> {
      if(fieldJudge(itemKey) && otherParams && otherParams[itemKey]) {
        cosParams[itemKey] = otherParams[itemKey]
      } else if(fieldJudge(itemKey) && mainParams && mainParams[itemKey]) {
        cosParams[itemKey] = mainParams[itemKey]
      }
    })
    if(otherParams) {
      this.qcloud = new COS(cosParams)
      this.qcAppId = mainParams.AppId
      this.qcSecretId = mainParams.SecretId
      this.qcSecretKey = mainParams.SecretKey
      this.qcBucket = mainParams.Bucket
      this.qcRegion = mainParams.Region
    } else {
      this.qcloud = new COS({
        AppId: mainParams.AppId,
        SecretId: mainParams.SecretId,
        SecretKey: mainParams.SecretKey,
      })
      this.qcAppId = mainParams.AppId
      this.qcSecretId = mainParams.SecretId
      this.qcSecretKey = mainParams.SecretKey
      this.qcBucket = mainParams.Bucket
      this.qcRegion = mainParams.Region
    }
  }

  upload(req, res, single, bucket) {
    var upload = multer({ storage: multer.diskStorage({}) }).single(single)
    var fileUrl = new Promise((resolve, reject)=> {
      if(!req) return resolve(null) //测试用
      upload(req, res, (err)=> {
        if(err) return reject(JSON.stringify(err))
        if(req.file) {
          var rs = fs.createReadStream(req.file.path)
            , md5Hash = crypto.createHash('md5')
          rs.on('data', md5Hash.update.bind(md5Hash))
          rs.on('end', ()=> {
            var t = new Date().getTime()
              , reTag = md5Hash.digest('hex')
            var params = {
              Bucket: bucket || this.qcBucket,
              Region: this.qcRegion,
              Key: single + '/' + t + '_' + req.file.originalname,
              Body: fs.readFileSync(req.file.path),
              ContentLength: req.file.size,
            }
            this.qcloud.putObject(params, (err, data)=> {
              if(err) return reject(JSON.stringify(err))
              delete data.headers.etag
              var url = geturl((bucket || this.qcBucket), this.qcAppId, params.Key)
              data.ETag = data.ETag.replace(/\"/g, "")
              if(reTag === data.ETag && data.statusCode === 200) resolve({
                ntCode: data.statusCode,
                fileUrl: url,
                data: data.headers,
              })
              else reject(`ETagError: ${reTag} != ${data.ETag}`)
              fs.unlinkSync(req.file.path)
            })
          })
        } else resolve(null)
      })
    })
    return fileUrl
  }

  uploadPath(filePath, single, bucket) {
    var fileUrl = new Promise((resolve, reject)=> {
      if(!filePath) return resolve(null)
      var rs = fs.createReadStream(filePath)
        , md5Hash = crypto.createHash('md5')
      rs.on('data', md5Hash.update.bind(md5Hash))
      rs.on('end', ()=> {
        var filePathArr = filePath.split('/')
          , fileName = filePathArr[(filePathArr.length - 1)]
        var t = new Date().getTime()
          , reTag = md5Hash.digest('hex')
        var params = {
          Bucket: bucket || this.qcBucket,
          Region: this.qcRegion,
          Key: single + '/' + t + '_' + fileName,
          Body: fs.readFileSync(filePath),
        }
        this.qcloud.putObject(params, (err, data)=> {
          if(err) return reject(JSON.stringify(err))
          delete data.headers.etag
          var url = geturl((bucket || this.qcBucket), this.qcAppId, params.Key)
          data.ETag = data.ETag.replace(/\"/g, "")
          if(reTag === data.ETag && data.statusCode === 200) resolve({
            ntCode: data.statusCode,
            fileUrl: url,
            data: data.headers,
          })
          else reject(`ETagError: ${reTag} != ${data.ETag}`)
        })
      })
    })
    return fileUrl
  }

  uploadStream(streamParams, single, bucket) {
    var fileUrl = new Promise((resolve, reject)=> {
      if(!streamParams) return resolve(null)
      var filePath = `ntQcosFile${streamParams.fileType}`
        , wrs = fs.createWriteStream(filePath, { 
        flags: 'w', 
        defaultEncoding: 'binary', 
        fd: null, 
        mode: 0o666, 
        autoClose: true 
      })
      wrs.write(streamParams.fileStream)
      wrs.end(()=> {
        var fileSize = fs.statSync(filePath).size
          , rs = fs.createReadStream(filePath)
          , md5Hash = crypto.createHash('md5')
        rs.on('data', md5Hash.update.bind(md5Hash))
        rs.on('end', ()=> {
          var t = new Date().getTime()
            , reTag = md5Hash.digest('hex')
          var params = {
            Bucket: bucket || this.qcBucket,
            Region: this.qcRegion,
            Key: single + '/' + t + '_' + filePath,
            Body: streamParams.fileStream,
            ContentLength: fileSize,
          }
          this.qcloud.putObject(params, (err, data)=> {
            if(err) return reject(JSON.stringify(err))
            delete data.headers.etag
            var url = geturl((bucket || this.qcBucket), this.qcAppId, params.Key)
            data.ETag = data.ETag.replace(/\"/g, "")
            if(reTag === data.ETag && data.statusCode === 200) resolve({
              ntCode: data.statusCode,
              fileUrl: url,
              data: data.headers,
            })
            else reject(`ETagError: ${reTag} != ${data.ETag}`)
            fs.unlinkSync(filePath)
          })
        })
      })
    })
    return fileUrl
  }

  deleteKey(fileUrl, bucket) {
    var result = new Promise((resolve, reject)=> {
      if(!fileUrl) return resolve('fileUrl is empty')
      var headUrl = 'https://' + (bucket || this.qcBucket) + '-' + this.qcAppId + '.cosgz.myqcloud.com/'
        , headUrlLength = headUrl.split('').length
      var key = decodeURIComponent(fileUrl.substring(headUrlLength))
      var params = {
        Bucket: bucket || this.qcBucket,
        Region: this.qcRegion,
        Key: key
      }
      this.qcloud.deleteObject(params, (err, data)=> {
        if(err) return reject(JSON.stringify(err))
        resolve({
          ntCode: data.statusCode,
          data: data.headers,
        })
      })
    })
    return result
  }

  serviceGet() {
    var getservice = new Promise((resolve, reject)=> {
      this.qcloud.getService((err, data)=> {
        if(err) {
          reject(JSON.stringify(err))
        } else {
          var statusCode = data.statusCode
          delete data.statusCode
          resolve({
            ntCode: statusCode,
            data: data,
          })
        }
      })
    })
    return getservice
  }

  authGet(authParams, diffCreatime) {    //xml
    var getauth = new Promise((resolve, reject)=> {
      if(!authParams || !authParams.Method) return resolve({
        ntCode: 4040,
        data: `Method为必填参数，可以为get、post、delete、head等HTTP方法`
      })
      let authParamsKey = Object.keys(authParams)
        , getauthParams = diffCreatime ? {
          SecretId: this.qcSecretId,
          SecretKey: this.qcSecretKey,
        } : {}
      authParamsKey.forEach((itemKey, index)=> {
        if(authFieldJudge(itemKey) && authParams[itemKey]) {
          getauthParams[itemKey] = authParams[itemKey]
        }
      })
      var Authorization = this.qcloud.getAuth(getauthParams)
        , fileUrl = ''
      if(authParams.Key) {
        fileUrl = `https://${authParams.Bucket || this.qcBucket}-${this.qcAppId}.cos.${beforeRegionChange(this.qcRegion)}.myqcloud.com/${encodeURIComponent(authParams.Key)}?sign=${encodeURIComponent(Authorization)}`
      } else {
        fileUrl = `https://${authParams.Bucket || this.qcBucket}-${this.qcAppId}.cos.${beforeRegionChange(this.qcRegion)}.myqcloud.com?sign=${Authorization}`
      }
      resolve({
        ntCode: 200,
        url: fileUrl,
        authorization: Authorization,
      })
    })
    return getauth
  }

  headBucket(bucket) {
    var headbucket = new Promise((resolve, reject)=> {
      this.qcloud.headBucket({
        Bucket: bucket || this.qcBucket,
        Region: this.qcRegion,
      }, (err, data)=> {
        if(err) reject(JSON.stringify(err))
        else {
          var statusCode = data.statusCode
          delete data.statusCode
          resolve({
            ntCode: statusCode,
            data: data,
          })
        }
      })
    })
    return headbucket
  }

  getBucket(bucket) {
    var getbucket = new Promise((resolve, reject)=> {
      this.qcloud.getBucket({
        Bucket: bucket || this.qcBucket,
        Region: this.qcRegion,
      }, (err, data)=> {
        if(err) reject(JSON.stringify(err))
        else {
          var statusCode = data.statusCode
            , contents = data.Contents
          delete data.statusCode
          delete data.Contents
          resolve({
            ntCode: statusCode,
            contents: contents,
            data: data,
          })
        }
      })
    })
    return getbucket
  }

  putBucket(bucket) {
    var putbucket = new Promise((resolve, reject)=> {
      this.qcloud.putBucket({
        Bucket: bucket,
        Region: this.qcRegion,
        // ACL: 'public-read',
      }, (err, data)=> {
        if(err) reject(JSON.stringify(err))
        else {
          var statusCode = data.statusCode
          delete data.statusCode
          resolve({
            ntCode: statusCode,
            data: data,
          })
        }
      })
    })
    return putbucket
  }

  deleteBucket(bucket) {
    var deletebucket = new Promise((resolve, reject)=> {
      this.qcloud.deleteBucket({
        Bucket: bucket,
        Region: this.qcRegion,
      }, (err, data)=> {
        if(err) reject(JSON.stringify(err))
        else {
          var statusCode = data.statusCode
          delete data.statusCode
          resolve({
            ntCode: statusCode,
            data: data,
          })
        }
      })
    })
    return deletebucket
  }

  // sliceUploadFile() {
  //   //不可用
  //   var filename = '10mb.zip';
  //   var filepath = path.resolve(__dirname, filename);
  //   util.createFile(filepath, 1024 * 1024 * 10, (err)=> {
  //       cos.sliceUploadFile({
  //           Bucket: config.Bucket,
  //           Region: config.Region,
  //           Key: filename,
  //           FilePath: filepath,
  //           TaskReady: (tid)=> {
  //               TaskId = tid;
  //           },
  //           onHashProgress: (progressData)=> {
  //               console.log(JSON.stringify(progressData));
  //           },
  //           onProgress: (progressData)=> {
  //               console.log(JSON.stringify(progressData));
  //           },
  //       }, (err, data)=> {
  //           console.log(err || data)
  //           fs.unlinkSync(filepath)
  //       })
  //   })
  // }

}

function geturl(bucket, appid, pathname) {
  var exporturl = 'https://' + bucket + '-' + appid + '.cosgz.myqcloud.com'
  if (pathname) {
    exporturl += '/' + encodeURIComponent(pathname)
  }
  return exporturl
}

function fieldJudge(key) {
  let exist = false
  switch(key) {
    case 'AppId': exist = true;break
    case 'SecretId': exist = true;break
    case 'SecretKey': exist = true;break
    case 'FileParallelLimit': exist = true;break
    case 'ChunkParallelLimit': exist = true;break
    case 'ChunkSize': exist = true;break
    case 'ProgressInterval': exist = true;break
    case 'Domain': exist = true;break
    default: null
  }
  return exist
}

function authFieldJudge(key) {
  let exist = false
  switch(key) {
    case 'Method': exist = true;break
    case 'Key': exist = true;break
    default: null
  }
  return exist
}

function beforeRegionChange(region) {
  switch(region) {
    case 'cn-south': region = 'ap-guangzhou';break
    case 'cn-east': region = 'ap-shanghai';break
    case 'cn-north': region = 'ap-beijing-1';break
    case 'cn-southwest': region = 'ap-chengdu';break
    case 'sg': region = 'ap-singapore';break
    default: region = region;
  }
  return region
}

/*
  {
    AppId: mainParams.AppId,
    SecretId: mainParams.SecretId,
    SecretKey: mainParams.SecretKey,
    FileParallelLimit: otherParams.FileParallelLimit,
    ChunkParallelLimit: otherParams.ChunkParallelLimit,
    ChunkSize: otherParams.ChunkSize,
    ProgressInterval: otherParams.ProgressInterval,
    Domain: otherParams.Domain,
  }
*/

module.exports = Qcos

