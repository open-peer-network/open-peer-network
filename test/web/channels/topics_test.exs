defmodule OPNWeb.TopicsTest do
  use ExUnit.Case, async: true
  use OPNWeb.TopicSP
  alias Salty.Random
  alias Salty.Box

  setup do
    c = Salty.Box.primitive()
    {:ok, public_key, secret_key} = c.keypair()
    {:ok, _, socket} =
      socket("user_id", %{public_key: public_key})
      |> subscribe_and_join(RoomChannel, "none")

    # {:ok, _, socket} = socket("user_id", %{public_key: public_key})
    {:ok, socket: socket, public_key: public_key, secret_key: secret_key}
  end

  test "Encrypt and decrypt" do
    c = Salty.Box.primitive()
    # {:ok, public_key, secret_key} = c.keypair()
    {:ok, nonce} = Random.buf(c.noncebytes())
    {:ok, ciphertext} = prim.easy("some message", nonce, secret_key, public_key)
    {:ok, plaintext} = prim.open_easy(ciphertext, nonce, secret_key, public_key)

    assert plaintext == "some message"
  end
end
