defmodule ElixirWebsocketWeb.Queries do

  def get_one(%{ "s" => id, "p" => predicates }) do
    ~s"""
      var result = {};
      var user = g.V('#{id}');
      var predicates = #{predicates};

      predicates.map(function(predicate) {
        result[predicate] = user.out(predicate).toValue();
      });

      g.emit(result);
    """
  end
end
