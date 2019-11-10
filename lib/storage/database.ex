defmodule ElixirWebsocket.Database do
  use Phoenix.Endpoint, otp_app: :elixir_websocket
  alias ElixirWebsocket.Caylir

  def query(%{"s" => subj, "p" => pred}, callback) do
    case Caylir.query(query_one(subj, pred)) do
      [data] ->
        callback(%{subject: subj, data: data})

      resp ->
        IO.puts("query failed miserably")
        IO.inspect(resp)
    end
  end

  def query_one(subj, pred) do
    ~s"""
      var result = {};
      var user = g.V(#{Jason.encode!(subj)});
      var predicates = #{Jason.encode!(pred)};

      predicates.map(function(predicate) {
        result[predicate] = user.out(predicate).toValue();
      });

      g.emit(result);
    """
  end
end
