defmodule OPNTest do
  use ExUnit.Case
  doctest OPN

  test "greets the world" do
    assert OPN.hello() == :world
  end
end
