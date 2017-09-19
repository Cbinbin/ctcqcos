# ctcqcos
上传文件到腾讯云存储的自用库，主要用到COS服务的Node.js SDK v5版本

```js
  npm install --save ctcqcos
```

然后在文件中先使用下面语句，再接着用方法。
```js
  const ctcqcos = require('ctcqcos')
  const qcos = new ctcqcos({
    AppId: '***',
    SecretId: '***',
    SecretKey: '***',
    Bucket: '***',
    Region: '***',
  })
```

## 上传文件
### qcos.upload(req, res, single, bucket)
由于upload用到了multer，所以 req 和 res 是必要参数，本人写API经常用到的。
single(string):  是Bucket里面的文件夹名，指定要传到哪个文件夹里，在form-data中上传文件的key也要为single的值。(必要)
bucket(string):  如果要上传到 和new ctcqcos()的Bucket 不一样时用到。(可选)

### qcos.uploadPath(filePath, single, bucket)
filePath(string):  文件在本地的路径。(必要)

### qcos.uploadStream(streamParams, single, bucket)
streamParams(object): {
  fileStream(string): 文件的buffer,
  fileType(string): 文件的类型(.后缀名),
} 。(必要)

## 删除上传的文件
### qcos.deleteKey(url, bucket)
url(string):  上传成功后返回的url。(必要)

## 获取存储空间列表
### qcos.serviceGet()

## 请求操作权限(xml)
### qcos.authGet(authParams)
authParams(object): {
  Method(string): http方法(get, post, delete, head),
  Key(string): 文件名(包括文件夹路径),
  Bucket(string): 和new ctcqcos()的Bucket 不一样时用到,
}。(必要)

## 验证Bucket
### qcos.headBucket(bucket)

## 获取Bucket
### qcos.getBucket(bucket)

## 创建Bucket
### qcos.putBucket(bucket)
注: 创建后为私有读写,只能去腾讯云存储上改成公有的权限。

## 删除Bucket
### qcos.deleteBucket(bucket)
注: 删除Bucket需要整个Bucket为空,否则删除失败。


