// pages/chat/chat.js
const app = getApp()
var utils = require('../../utils/util.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    newslist: [],
    userInfo: {},
    scrollTop: 0,
    increase: false, //图片添加区域隐藏
    aniStyle: true, //动画效果
    message: "",
    previewImgList: [],
    gender: ['美女', '帅哥'],
    expression: ['黯然伤神', '半嗔半喜', '似笑非笑', '笑逐颜开', '眉开眼笑', '喜上眉梢', '心花怒放', '一笑倾城', '笑skr'],
    glass: ['戴上', '不戴'],
    young: '',
    ltimes:15
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    var that = this
    if (app.globalData.userInfo) {

      this.setData({
        userInfo: app.globalData.userInfo,
        newslist: [{
          id: 0,
          nickName: '小龟',
          content: '你好呀，' + app.globalData.userInfo.nickName + '，想聊多少钱的？',
          type: 'text'
        }]
      })
    }
  },
  // 页面卸载
  onUnload() {
    wx.closeSocket();
    wx.showToast({
      title: '连接已断开~',
      icon: "none",
      duration: 2000
    })
  },
  //事件处理函数
  send: function () {
    var flag = this;
    var m = flag.data.message.trim();
    if (m == "") {
      wx.showToast({
        title: '消息不能为空哦~',
        icon: "none",
        duration: 2000
      });
      return;
    }
    // setTimeout(function () {
    //   flag.setData({
    //     increase: false
    //   })
    // }, 500);

    // 追加你的发言
    let dialog = flag.data.newslist;
    dialog.push({
      id: dialog.length,
      nickName: flag.data.userInfo.nickName,
      content: m,
      type: 'text'
    });
    flag.setData({
      newslist: dialog
    }, () => {
      // flag.bottom();
    });
    //发送聊天内容到服务器
    wx.request({
      url: 'http://localhost:7001/chat', //仅为示例，并非真实的接口地址
      data: {
        message: m
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success(res) {
        console.log(res.data);
        let dialog = flag.data.newslist;
        let msg = '你说啥那';
        if (!res.data.ret) {
          msg = res.data.data.answer;
        } else if (res.data.ret == 16394) {
          msg = '这个话题聊不下去的，换一个吧';
        } else {
          msg = res.data.msg;
        }
        dialog.push({
          id: dialog.length + 1,
          nickName: '小龟',
          content: msg,
          type: 'text'
        });
        flag.setData({
          newslist: dialog
        }, function () {
          flag.bottom();
        });
      }
    })
  },
  //监听input值的改变
  bindChange(res) {
    this.setData({
      message: res.detail.value
    })
  },
  cleanInput() {
    //button会自动清空，所以不能再次清空而是应该给他设置目前的input值
    this.setData({
      message: this.data.message
    })
  },
  increase() {
    this.setData({
      increase: true,
      aniStyle: true
    })
  },
  hideMedia() {
    this.setData({
      increase: false,
      aniStyle: true
    })
  },
  //点击空白隐藏message下选框
  outbtn() {
    this.setData({
      increase: false,
      aniStyle: true
    })
  },
  startRecord() {
    let that = this;
    let dialog = that.data.newslist;
    wx.showToast({
      title: `有话你就说`,
      image: './images/chat.png',
      duration: 15000
    });

    wx.startRecord({
      success(res) {
        wx.showLoading({
          title: '正在听...',
          mask:true
        });

        let tempFilePath = res.tempFilePath;
        const fm = wx.getFileSystemManager();
        fm.readFile({
          filePath: tempFilePath,
          encoding: 'base64',
          success: function (res) {
            // 提交数据到服务器
            wx.request({
              url: app.globalData.host + '/record',
              data: {
                records: res.data
              },
              method: 'POST',
              header: {
                'content-type': 'application/json' // 默认值
              },
              success(response) {
                wx.hideLoading();
                // 识别失败
                if (response.data.ret) {
                  dialog.push({
                    id: dialog.length + 1,
                    nickName: that.data.userInfo.nickName,
                    content: '叽哩哇啦',
                    type: 'text'
                  },{
                    id: dialog.length + 2,
                    nickName: '小清',
                    content: '说的啥，你在吃糖吗？',
                    type: 'text'
                  });
                  that.setData({
                    newslist: dialog
                  }, function () {
                    that.bottom();
                  });
                  return ;
                }
                //处理成功的
                if(response.data.ret == 0){
                  that.setData({
                    newslist: dialog,
                    message:response.data.data.text
                  }, function () {
                    that.bottom();
                    //调用 发言
                    that.send(true);
                  });
                }
              }
            })
          }
        });
      }
    });
    //最多15s
    setTimeout(() => {
      wx.stopRecord({
        success(res) {
          wx.hideToast();
        }
      });
    }, 15000);

  },
  stopRecord() {
    wx.stopRecord({
      success(res) {
        wx.hideToast();
      }
    })
  },
  chooseImage() {
    var that = this
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var tempFilePaths = res.tempFilePaths
        wx.uploadFile({
          url: app.globalData.host + '/face',
          filePath: tempFilePaths[0],
          name: 'file',
          headers: {
            'Content-Type': 'form-data'
          },
          success: function (res) {
            if (res.data) {
              let dialog = that.data.newslist;
              dialog.push({
                id: dialog.length + 1,
                images: JSON.parse(res.data).src,
                type: 'image',
                nickName: that.data.userInfo.nickName,
              });
              that.setData({
                newslist: dialog
              }, function () {
                that.bottom();
                // 展示分析结果
                that.showFaceinfo(JSON.parse(res.data));
              });
            }
          }
        })

      }
    })
  },
  showFaceinfo(data) {
    let that = this;
    //定时只是起到效果作用 表示分析了一下
    let dialog = that.data.newslist;
    if (data.code == 1) {
      if (data.faceinfo.gender < 50) {
        data.faceinfo.gender = 0;
      } else {
        data.faceinfo.gender = 1;
      }
      data.faceinfo.expression = Math.ceil(data.faceinfo.expression / 10) - 1;
      data.faceinfo.expression = data.faceinfo.expression < 0 ? 0 : data.faceinfo.expression;
      if (data.faceinfo.age < 15) {
        that.setData({
          young: '小'
        });
      }

      setTimeout(() => {
        // dialog.push({
        //   id: dialog.length + 1,
        //   faceinfo: data.faceinfo,
        //   type: 'face',
        //   nickName: '小清',
        // });
        let d = data.faceinfo;
        dialog.push({
          id: dialog.length + 1,
          content: `${that.data.young}${that.data.gender[d.gender]}，你看上去有${d.age}岁了，${that.data.expression[d.expression]}的表情，和你${d.beauty}度的气质很是搭配，也许${that.data.glass[d.glass]}眼镜更有气质~~~哈哈`,
          type: 'text',
          nickName: '小清',
        });

        that.setData({
          newslist: dialog,
          young: ''
        }, function () {
          that.bottom();
        });

      }, 1000);
    } else {
      dialog.push({
        id: dialog.length + 1,
        content: `这是个人儿吗？我怎么看不透了`,
        type: 'text',
        nickName: '小清',
      });
      that.setData({
        newslist: dialog
      }, function () {
        that.bottom();
      });
    }
  },
  //图片预览
  previewImg(e) {
    var that = this
    //必须给对应的wxml的image标签设置data-set=“图片路径”，否则接收不到
    var res = e.target.dataset.src
    var list = this.data.previewImgList //页面的图片集合数组

    //判断res在数组中是否存在，不存在则push到数组中, -1表示res不存在
    if (list.indexOf(res) == -1) {
      this.data.previewImgList.push(res)
    }
    wx.previewImage({
      current: res, // 当前显示图片的http链接
      urls: that.data.previewImgList // 需要预览的图片http链接列表
    })

  },
  //聊天消息始终显示最底端
  bottom: function () {
    wx.pageScrollTo({
      scrollTop: 1000000000
    })
  },
})