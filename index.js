var Meetup = require("meetup")
var mup = new Meetup()
var app = require('express')()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var topicsCounter = {};

//refactoring version
server.listen(3002)


io.on('connection', socket => {
  console.log('got connection')
})

const INTERESTS = [
  'software development'
]

// count the occurrences of each topic
function countOccurrences(topicNames) {
  topicNames.forEach(name => {
    if (!topicsCounter[name]) return topicsCounter[name] = 1
    topicsCounter[name]++
  })
}

// sort the array of topics to create a top10
function topTen() {
  return Object.keys(topicsCounter)
    .sort((topicA, topicB) => (topicsCounter[topicB] - topicsCounter[topicA]))
    .slice(0, 10)
    .map(topic => ({
      topic,
      count: topicsCounter[topic]
    }))
}

function isInterestingTopic(topics) {
  return topics
    .filter(topic => (INTERESTS.includes(topic.toLowerCase())))
    .length > 0
}

function isNotAnInterestingTopic(topics) {
  return !isInterestingTopic(topics)
}

mup.stream("/2/rsvps", stream => {
  stream
    .on("data", item => {
      const topicNames = item.group.group_topics.map(topic => topic.topic_name)

      if (isNotAnInterestingTopic(topicNames)) return

      countOccurrences(topicNames)

      console.log(topTen())
      io.emit('action',     {
        type: 'UPDATE_TOPICS',
        payload: topTen()
      })
    }).on("error", e => {
       console.log("error! " + e)
    });
});

/*
io.emit('action',     {
  type: 'ADD_RSVP',
  payload: item
}) after fix reducer in frontend*/
