defmodule OPNWeb.TopicsTest do
  use ExUnit.Case, async: true
  use OPNWeb.TopicSP
  alias Salty.Random, as: Rand

  setup do
    prim = Salty.Auth.primitive()
    input = <<"test input">>
    {:ok, secret_key} = Rand.buf(prim.keybytes())
    {:ok, public_key} = Salty.Kdf.primitive.derive_from_key(32, 1, input, key)

    {:ok, _, socket} = socket("user_id", %{public_key: public_key})
  end

  test "test 1" do
    assert 1 == 1
  end
end
