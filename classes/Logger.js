module.exports = (scope) =>
{
  const log = require('signale').scope(scope)

  log.config({
    displayDate: true,
    displayTimestamp: true
  })

  return log
}