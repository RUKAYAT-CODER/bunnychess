--[[
  Remove matched players from a queue.

  Input:
    KEYS[1] queue key from which players should be removed
    KEYS[2] hash key where queue join times are stored
    KEYS[3] key that holds account id 0 status
    KEYS[4] key that holds account id 1 status

    ARGV[1] account 0 id
    ARGV[2] account 1 id

  Output:
    2 - both players successfully removed from the queue
    0/1 - number of players that were not in the queue at the time of pairing (no players removed)
]]

local queueKey = KEYS[1]
local timesKey = KEYS[2]
local accountId0StatusKey = KEYS[3]
local accountId1StatusKey = KEYS[4]
local accountId0 = ARGV[1]
local accountId1 = ARGV[2]

local accountId0InQueue = redis.call('ZSCORE', queueKey, accountId0) and 1 or 0
local accountId1InQueue = redis.call('ZSCORE', queueKey, accountId1) and 1 or 0

-- Only proceed if both players are still in the queue when this script runs
local result = accountId0InQueue + accountId1InQueue
if result ~= 2 then
  return result
end

for _, accountIdAndKey in ipairs({{accountId0, accountId0StatusKey}, {accountId1, accountId1StatusKey}}) do
  local accountId, statusKey = unpack(accountIdAndKey)
  redis.call('ZREM', queueKey, accountId)
  redis.call('HDEL', timesKey, accountId)
  redis.call('DEL', statusKey)
end

return result
