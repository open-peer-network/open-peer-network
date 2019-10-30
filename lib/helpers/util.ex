defmodule ElixirWebsocketWeb.Util do

  def uuid() do
    :crypto.hash(:sha256, "#{:os.system_time(:seconds) + :rand.uniform(1_000)}")
    |> Base.encode16
  end
end
