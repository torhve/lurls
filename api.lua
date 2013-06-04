-- lurls API backend
local cjson = require "cjson"
local pg = require "resty.postgres" -- https://github.com/azurewang/lua-resty-postgres
local http = require "resty.http.simple" -- https://github.com/bakins/lua-resty-http-simple

local conf
if not conf then
    local f = assert(io.open(ngx.var.document_root .. "/config.json", "r"))
    local c = f:read("*all")
    f:close()

    conf = cjson.decode(c)
end

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
    --ngx.log(ngx.ERR, '___ SQL ___'..sql)
    local res, err = db:query(sql)
    db:set_keepalive(0,10)
    return res
end

local function argsToConstraints()
    local args = ngx.req.get_uri_args()
    local limit = 50
    local offset = 0
    local where = ''
    if args['channelName'] then
        where = string.format("WHERE channel = '#%s'", pg.escape_string(args['channelName']))
    else 
        ngx.exit(403)
    end

    if args['query'] then
        where = where .. string.format(" AND url ~* '%s'", args['query'])
    end

    if tonumber(args['amount']) then
        limit = tonumber(args['amount'])
    end
    if tonumber(args['page']) then
        offset = (tonumber(args['page']) * limit)-limit
    end
    return where, limit, offset
end

local function recent(match) 
    local where, limit, offset = argsToConstraints()
    return cjson.encode(dbreq([[
        SELECT * 
        FROM urls 
        ]]..where..[[
        ORDER BY time DESC 
        LIMIT ]]..limit..[[
        OFFSET ]]..offset))
end

local function topurl(match)
    local where, limit, offset = argsToConstraints()
    local sql = [[
        SELECT 
            url,
            count(*) as count
        FROM 
            urls
        ]]..where..[[
        GROUP BY url
        ORDER BY count DESC
        LIMIT ]]..limit..[[
        OFFSET ]]..offset
    local ok = dbreq(sql)
    ngx.log(ngx.ERR, sql)
    return cjson.encode(ok)
end


local routes = {
    ['$']    = recent,
    ['topurl$'] = topurl,
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
