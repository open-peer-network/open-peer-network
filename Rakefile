desc "reset database"

pid = %x[ pgrep cayley ]

namespace :db do

  task :start do
    if Dir["./cayley.db/indexes*"].length > 0
      %x[ cayley http ]
    else
      %x[ cayley init && cayley http ]
    end
  end

  task :reset do
    if pid != ""
      %x[ kill #{pid} ]
    end
    %x[ rm ./cayley.db/indexes* && cayley init ]
  end
end
