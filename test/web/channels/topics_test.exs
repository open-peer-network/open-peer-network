defmodule OPNWeb.TopicsTest do
  use ExUnit.Case, async: true
  # use OPNWeb.ChannelCase
  alias OPN.Util

  # setup do
  #   {:ok, _, socket} =
  #     socket("user_id", %{public_key: public_key})
  #     |> subscribe_and_join(RoomChannel, "none")

  #   {:ok, _, socket} = socket("user_id", %{public_key: public_key})
  # end

  test "Encrypt and decrypt" do
    {:ok, ciphertext} = Util.encrypt(Util.get_public_key(), "some message")
    {:ok, plaintext} = Util.decrypt(Util.get_public_key(), ciphertext)

    # {:ok, nonce} = Random.buf(box.noncebytes())
    # {:ok, ciphertext} = box.easy("some message", nonce, secret_key, public_key)
    # {:ok, plaintext} = box.open_easy(ciphertext, nonce, secret_key, public_key)

    assert plaintext == "some message"
  end
end
