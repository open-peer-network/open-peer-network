defmodule OPN.Util do
  def unpack_ets(lookedup) do
    lookedup |> List.first() |> Tuple.to_list() |> Enum.at(1)
  end

  def get_data(lookedup) do
    case :ets.lookup(:sp, lookedup) do
      [] -> false
      result -> result |> unpack_ets()
    end
  end

  def get_secret_key() do
    :ets.lookup(:keys, :secret_key) |> unpack_ets()
  end

  def get_public_key() do
    :ets.lookup(:keys, :public_key) |> unpack_ets()
  end

  def get_users_on_topic(topic) do
    case :ets.lookup(:users, topic) do
      [] -> []
      results -> results |> unpack_ets()
    end
  end

  def encrypt(%Phoenix.Socket{} = socket, data) when is_binary(data) do
    encrypt(socket.assigns.public_key, data)
  end

  def encrypt(public_key, data) do
    Kcl.box(
      data,
      :crypto.strong_rand_bytes(24),
      get_secret_key(),
      Base.decode64!(public_key)
    )
  end

  def decrypt(socket, box, nonce) when is_binary(box) and is_binary(nonce) do
    {json, _state} =
      Kcl.unbox(
        Base.decode64!(box),
        Base.decode64!(nonce),
        get_secret_key(),
        Base.decode64!(socket.assigns.public_key)
      )

    json
  end
end
