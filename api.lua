-- lurls API backend
local cjson = require "cjson"
local pg = require "resty.postgres" -- https://github.com/azurewang/lua-resty-postgres
local http = require "resty.http.simple" -- https://github.com/bakins/lua-resty-http-simple


local conf = {
    db = {
        host = '127.0.0.1',
        database = 'irc',
        user = 'lorelai',
        password = 'l0rel4i',
    }
}

local function dbreq(sql)
    local db = pg:new()
    db:set_timeout(3000)
    local ok, err = db:connect(
        {
            host=conf.db.host,
            port=5432,
            database=conf.db.database,
            user=conf.db.user,
            password=conf.db.password,
            compact=false
        })
    if not ok then
        ngx.say(err)
    end
    ---ngx.log(ngx.ERR, '___ SQL ___'..sql)
    local res, err = db:query(sql)
    db:set_keepalive(0,10)
    return res
end

local function recent(match) 
    return cjson.encode(dbreq('SELECT * from urls ORDER BY time DESC limit 50'))
end


local routes = {
    ['$'] = recent,
}
-- Set the content type
ngx.header.content_type = 'application/json';
-- Our URL base, must match location in nginx config
local BASE = '/api/'
-- iterate route patterns and find view
for pattern, view in pairs(routes) do
    local uri = '^' .. BASE .. pattern
    local match = ngx.re.match(ngx.var.uri, uri, "oj") -- regex mather in compile mode
    if match then
        local ret, exit = view(match)
        -- Print the returned res
        ngx.print(ret)
        -- If not given exit, then assume OK
        if not exit then exit = ngx.HTTP_OK end
        -- Exit with returned exit value
        ngx.exit( exit )
    end
end
-- no match, return 404
ngx.exit( ngx.HTTP_NOT_FOUND )
