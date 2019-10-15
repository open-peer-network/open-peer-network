defmodule ElixirWebsocketTest do
  use ExUnit.Case
  doctest ElixirWebsocket

  test "greets the world" do
    assert ElixirWebsocket.hello() == :world
  end
end
