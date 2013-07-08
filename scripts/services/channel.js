Coldstorm.provider("Channel", function()
{
    var registry = { };
    
    this.$get = function()
    {
        this.register = function(name)
        {
            name = name.replace("%23", "#");
            
            registry[name] = {
                addLine: function(message, author)
                {
                    line = {
                        author: null,
                        message: "",
                        systemMessage: false,
                        time: new Date()
                    };
                    
                    if (author)
                    {
                        line.author = author;
                    } else
                    {
                        line.systemMessage = true;
                    }
                    
                    line.message = message;
                    
                    this.lines.push(line);
                    
                    return this;
                },
                addUser: function(user)
                {
                    this.users.push(user);
                    
                    this.users = this.users.sort(function(a, b)
                    {
                        var ranks = ["", "+", "%", "@"];
                        
                        if (a.rank != b.rank)
                        {
                            if (ranks.indexOf(a.rank) > ranks.indexOf(b.rank))
                            {
                                return -1;
                            }
                            
                            return 1;
                        }
                        
                        return a.nickName.localeCompare(b.nickName);
                    });
                    
                    return this;
                },
                active: false,
                leave: function()
                {
                    delete registry[name];
                },
                lines: [],
                name: name,
                topic: "Temporary topic",
                users: []
            };
            
            registry[name].addLine("You joined the room.");
            
            return registry[name];
        };
        
        this.all = function()
        {
            var channels = [];
            
            for (channel in registry)
            {
                channels.push(registry[channel]);
            }
            
            return channels;
        };
        
        this.get = function(name)
        {
            return registry[name];
        };
        
        return this;
    };
});
