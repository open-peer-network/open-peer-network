defmodule ElixirWebsocket.Guardian do
  use Guardian, otp_app: :elixir_websocket
  # alias ElixirWebsocket.Database

  def subject_for_token(resource, _claims) do
    {:ok, to_string(resource.id)}
  end

  def resource_from_claims(claims) do
    IO.puts("resource_from_claims: #{inspect(claims)}")
    {:ok, %{"email" => "user@example.com"}}
  end
end
