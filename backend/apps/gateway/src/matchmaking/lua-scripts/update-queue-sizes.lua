--[[
  Save new queue sizes data and return stored value, or return nil if stored value is the same as the previously cached one.

  Input:
    KEYS[1] queue sizes key

    ARGV[1] new queue sizes data

  Output:
    string - newly stored value if different from cached one
    nil - if provided value is the same as the previously cached one
]]

local queueSizesKey = KEYS[1]
local newValue = ARGV[1]

local oldValue = redis.call('GET', queueSizesKey)

if oldValue == newValue then
  return nil
end

redis.call('SET', queueSizesKey, newValue)
return newValue
