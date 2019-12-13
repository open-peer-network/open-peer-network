defmodule OPN.Util do

  def unpack_ets(lookedup) do
    lookedup |> List.first() |> Tuple.to_list() |> Enum.at(1)
  end

  def get_secret_key(), do: :ets.lookup(:keys, :secret_key) |> unpack_ets()
  def get_secret_key(:base64), do: :ets.lookup(:keys, :secret_key_base64) |> unpack_ets()

  def get_public_key(), do: :ets.lookup(:keys, :public_key) |> unpack_ets()
  def get_public_key(:base64), do: :ets.lookup(:keys, :public_key_base64) |> unpack_ets()

  def get_users_on_topic(topic) do
    case :ets.lookup(:users, topic) do
      [] -> []
      results -> results |> unpack_ets()
    end
  end

  def encrypt(%Phoenix.Socket{} = socket, data) when is_binary(data) do
    socket.assigns.public_key
    |> Base.decode64!()
    |> encrypt(data)
  end

  def encrypt(public_key, plaintext) do
    nonce = :crypto.strong_rand_bytes(24)
    {:ok, ciphertext} = Salty.Box.primitive().easy(
      plaintext,
      nonce,
      public_key,
      get_secret_key()
    )
    IO.puts("nonce: #{inspect(nonce)}")
    IO.puts("ciphertext: #{inspect(ciphertext)}")

    nonce <> ciphertext
  end

  def decrypt(%Phoenix.Socket{} = socket, ciphertext) do
    nonce_size = Salty.Box.primitive().noncebytes()
    <<nonce::binary-size(nonce_size), ciphertext::binary>> = ciphertext |> Base.decode64!()

    socket.assigns.public_key
    |> Base.decode64!()
    |> decrypt(ciphertext, nonce)
  end

  defp decrypt(public_key, ciphertext, nonce) do
    Salty.Box.primitive().open_easy(
      ciphertext,
      nonce,
      public_key,
      get_secret_key()
    )
  end
end
