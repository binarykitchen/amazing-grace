var o=["SIGTERM","SIGINT","SIGUSR2"];module.exports=function(n,t){void 0===t&&(t={});var e=!1;return t.timeout=t.timeout||100,t.log=t.log||function(){},n.on("listening",function(){o.forEach(function(o){process.once(o,function(){!function(o,n){var i=setTimeout(function(){t.log("Could not close connections in %sms, forcefully shutting down",t.timeout),process.kill(process.pid,n)},t.timeout);e=!0,t.log("Received %s at %s, shutting down gracefully in %sms",n,(new Date).toString("T"),t.timeout),o.close(function(){clearTimeout(i),t.log("Closed out remaining connections"),process.kill(process.pid,n)})}(n,o)})})}),function(o,n,t){e&&o.connection.setTimeout(1),t()}};
//# sourceMappingURL=amazing-grace.mjs.map
