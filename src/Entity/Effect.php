<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\EffectRepository")
 */
class Effect implements \JsonSerializable
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $description;

    /**
     * @ORM\Column(type="string", length=3)
     */
    private $dimension;

    /**
     * @ORM\Column(type="string", length=1)
     */
    private $order_of_effect;

    /**
     * @ORM\Column(type="boolean")
     */
    private $is_positive;

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $note;

    /**
     * @ORM\ManyToMany(targetEntity="App\Entity\Effect", inversedBy="consequences")
     */
    private $causes;

    /**
     * @ORM\ManyToMany(targetEntity="App\Entity\Effect", mappedBy="causes")
     */
    private $consequences;

    /**
     * @ORM\ManyToOne(targetEntity="App\Entity\User", inversedBy="effects")
     * @ORM\JoinColumn(nullable=false)
     */
    private $creator;

    public function __construct()
    {
        $this->causes = new ArrayCollection();
        $this->consequences = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getDimension(): ?string
    {
        return $this->dimension;
    }

    public function setDimension(string $dimension): self
    {
        $this->dimension = $dimension;

        return $this;
    }

    public function getOrderOfEffect(): ?string
    {
        return $this->order_of_effect;
    }

    public function setOrderOfEffect(string $order_of_effect): self
    {
        $this->order_of_effect = $order_of_effect;

        return $this;
    }

    public function getIsPositive(): ?bool
    {
        return $this->is_positive;
    }

    public function setIsPositive(bool $is_positive): self
    {
        $this->is_positive = $is_positive;

        return $this;
    }

    public function getNote(): ?string
    {
        return $this->note;
    }

    public function setNote(?string $note): self
    {
        $this->note = $note;

        return $this;
    }

    /**
     * @return Collection|self[]
     */
    public function getCauses(): Collection
    {
        return $this->causes;
    }

    public function addCause(self $cause): self
    {
        if (!$this->causes->contains($cause)) {
            $this->causes[] = $cause;
        }

        return $this;
    }

    public function removeCause(self $cause): self
    {
        if ($this->causes->contains($cause)) {
            $this->causes->removeElement($cause);
        }

        return $this;
    }

    /**
     * @return Collection|self[]
     */
    public function getConsequences(): Collection
    {
        return $this->consequences;
    }

    public function addConsequence(self $consequence): self
    {
        if (!$this->consequences->contains($consequence)) {
            $this->consequences[] = $consequence;
            $consequence->addCause($this);
        }

        return $this;
    }

    public function removeConsequence(self $consequence): self
    {
        if ($this->consequences->contains($consequence)) {
            $this->consequences->removeElement($consequence);
            $consequence->removeCause($this);
        }

        return $this;
    }

    public function jsonSerialize()
    {
        $causes = array_map(function(Effect $elem){
            return  [
                'id' => $elem->getId(),
                'label' => $elem->getDescription(),
            ];
        }, $this->causes->getValues());;
        $consequences = array_map(function(Effect $elem){
            return  [
                'id' => $elem->getId(),
                'label' => $elem->getDescription(),
            ];
        }, $this->consequences->getValues());;


        return [
        'effect' => [
            'id' => $this->id,
            'label' => $this->description,
            'note' => $this->note,
            'dimension' => $this->dimension,
            'order' => (int)$this->order_of_effect,
            'isPositive' => $this->is_positive,
            'causes' => $causes,
            'consequences' => $consequences,
        ]
    ];
    }

    public function __toString()
    {
        return json_encode($this);
    }

    public function getCreator(): ?User
    {
        return $this->creator;
    }

    public function setCreator(?User $creator): self
    {
        $this->creator = $creator;

        return $this;
    }

}
