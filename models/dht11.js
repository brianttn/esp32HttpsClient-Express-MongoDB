const mongoose = require('mongoose');

/* = = = = = =   使用「mongoose：Schema」建立 => dht11Schema   = = = = = = */
const dht11Schema = new mongoose.Schema(
    {
        'temperature': {
            type: Number,
            trim: true      // 清除前後的空格
        },
        'humidity': {
            type: Number,
            trim: true
        },
        'time': {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true    // 建立：document的「createdAt」與「updatedAt」時間
    }
);

/* - - - 新增dht11Schema的「Instance」 Method：show() - - - */
dht11Schema.methods.show = function () {
    const msg = `溫度：${this.temperature}、濕度：${this.humidity}、時間：${this.time}`
    console.log(msg);
}

/* = = =   使用「mongoose：model()」建立 => dhtConstructor   = = = */
const dhtConstructor = mongoose.model('dhtData', dht11Schema);

module.exports = dhtConstructor;