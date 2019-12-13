defmodule OPNWeb.TopicsTest do
  use ExUnit.Case, async: true
  # use OPNWeb.ChannelCase
  alias Salty.Random
  alias Salty.Box

  setup do
    box = Box.primitive()
    {:ok, public_key, secret_key} = box.keypair()
    # {:ok, _, socket} =
    #   socket("user_id", %{public_key: public_key})
    #   |> subscribe_and_join(RoomChannel, "none")

    # {:ok, _, socket} = socket("user_id", %{public_key: public_key})
    {:ok, public_key: public_key, secret_key: secret_key}
  end

  test "Encrypt and decrypt", %{public_key: public_key, secret_key: secret_key} do
    box = Box.primitive()
    # {:ok, public_key, secret_key} = c.keypair()
    {:ok, nonce} = Random.buf(box.noncebytes())
    {:ok, ciphertext} = box.easy("some message", nonce, secret_key, public_key)
    {:ok, plaintext} = box.open_easy(ciphertext, nonce, secret_key, public_key)

    assert plaintext == "some message"
  end
end
