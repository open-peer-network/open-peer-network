defmodule OPN.Util do
  alias Salty.Box

  def unpack_ets(lookedup) do
    lookedup |> List.first() |> Tuple.to_list() |> Enum.at(1)
  end

  def initialize_keys() do
    :ets.new(:keys, [:named_table])
    {:ok, public_key, secret_key} = Box.primitive().keypair()
    :ets.insert(:keys, {:secret_key, secret_key})
    :ets.insert(:keys, {:public_key, public_key})
    :ets.insert(:keys, {:secret_key_base64, safe_encode64(secret_key)})
    :ets.insert(:keys, {:public_key_base64, safe_encode64(public_key)})
    :ok
  end

  def safe_decode64(bytes) do
    case String.match?(bytes, ~r/^base64:/) do
      true ->
        "base64:" <> bytes = bytes
        case Base.decode64(bytes) do
          {:ok, string} -> string
          {:error} -> nil
        end
      false ->
        nil
    end
  end

  def get_data(lookedup) do
    case :ets.lookup(:sp, lookedup) do
      [] -> false
      result -> result |> unpack_ets()
    end
  end

  def safe_encode64(bytes) do
    case String.match?(bytes, ~r/^base64:/) do
      true -> bytes
      false -> "base64:" <> Base.encode64(bytes)
    end
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
    |> safe_decode64()
    |> encrypt(data)
  end

  def encrypt(public_key, plaintext) do
    nonce = :crypto.strong_rand_bytes(24)
    {:ok, ciphertext} = Box.primitive().easy(
      plaintext,
      nonce,
      public_key,
      get_secret_key()
    )
    {:ok, nonce <> ciphertext}
  end

  def decrypt(%Phoenix.Socket{} = socket, ciphertext) do
    socket.assigns.public_key
    |> safe_decode64()
    |> decrypt(ciphertext)
  end

  def decrypt(nil, _ciphertext) do
    IO.warn("Can't decrypt from invalid encoding")
  end

  def decrypt(public_key, ciphertext) do
    IO.puts("pubkey: #{inspect(public_key)}, ciphertext: #{inspect(ciphertext)}")
    nonce_size = Box.primitive().noncebytes()
    <<nonce::binary-size(nonce_size), ciphertext::binary>> = safe_decode64(ciphertext)

    Box.primitive().open_easy(
      ciphertext,
      nonce,
      public_key,
      get_secret_key()
    )
  end
end
