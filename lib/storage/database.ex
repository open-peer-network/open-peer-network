defmodule ElixirWebsocket.Database do
  use Phoenix.Endpoint, otp_app: :elixir_websocket
  alias ElixirWebsocket.Caylir

  def query(%{ "s" => s, "p" => p }, socket) do
    case Caylir.query query_one(s, p) do
      [data] ->
        Phoenix.Channel.push(socket, "query_result", data)
      _ ->
        IO.puts "query failed miserably"
    end
  end

  def query_one(subject, predicates) do
    ~s"""
      var result = {};
      var user = g.V(#{Jason.encode! subject});
      var predicates = #{Jason.encode! predicates};

      predicates.map(function(predicate) {
        result[predicate] = user.out(predicate).toValue();
      });

      g.emit(result);
    """
  end
end
