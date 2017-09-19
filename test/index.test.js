const qcos = require('../index')
  , expect = require('chai').expect
  , should = require('chai').should()
  , qcloudcos = new qcos({
    AppId: '***',
    SecretId: '***',
    SecretKey: '***',
    Bucket: '***',
    Region: '***',
  })
  // , {
  //   FileParallelLimit: '456',
  //   ChunkParallelLimit: '456',
  //   ChunkSize: '456',
  //   ProgressInterval: '456',
  //   Domain: '456',
  // }

describe('功能测试', ()=> {
  describe('upload', ()=> {
    it('直接上传文件', (done)=> {
      qcloudcos.upload(null, null, 'null').then((data)=> {
        expect(data).to.not.be.exist
        done()
      })
    })
  })

  describe('uploadPath', ()=> {
    it('路径上传文件', (done)=> {
      qcloudcos.uploadPath(null, 'null').then((data)=> {
        expect(data).to.not.be.exist
        done()
      })
    })
  })

  describe('uploadStream', ()=> {
    it('缓存流上传文件', (done)=> {
      qcloudcos.uploadStream(null, 'null').then((data)=> {
        expect(data).to.not.be.exist
        done()
      })
    })
  })

  describe('deleteKey', ()=> {
    it('删除文件', (done)=> {
      qcloudcos.deleteKey().then((data)=> {
        expect(data).to.be.equal('fileUrl is empty')
        done()
      })
    })
  })

  describe('serviceGet', ()=> {
    it('获取所有存储列表', (done)=> {
      qcloudcos.serviceGet().then((data)=> {
        expect(data).to.be.an('object')
        done()
      })
    })
  })

  describe('authGet', ()=> {
    it('获取验证签名', (done)=> {
      qcloudcos.authGet(null, null).then((data)=> {
        expect(data).to.be.an('object')
        done()
      })
    })
  })

  describe('headBucket', ()=> {
    it('查看Bucket', (done)=> {
      qcloudcos.headBucket(null).then((data)=> {
        expect(data).to.be.an('object')
        done()
      })
    })
  })

  describe('getBucket', ()=> {
    it('获取Bucket', (done)=> {
      qcloudcos.getBucket(null).then((data)=> {
        expect(data).to.be.an('object')
        done()
      })
    })
  })

  describe('putBucket', ()=> {
    it('创建Bucket', (done)=> {
      qcloudcos.putBucket('bucket').then((data)=> {
        expect(data).to.be.an('object')
        done()
      })
    })
  })

  describe('deleteBucket', ()=> {
    it('删除Bucket', (done)=> {
      qcloudcos.deleteBucket('bucket').then((data)=> {
        expect(data).to.be.an('object')
        done()
      })
    })
  })
})